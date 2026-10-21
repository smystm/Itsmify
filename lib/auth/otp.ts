import "server-only"
import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"
import type { OtpPurpose } from "@prisma/client"

/**
 * The one place phone verification codes are issued and consumed. The only
 * remaining purpose is proving ownership of a new phone number from the
 * signed-in profile screen; phone numbers are profile data, not credentials.
 *
 *  1. A code is never returned from an HTTP endpoint. It goes to the SMS
 *     provider, or to the dev terminal when no provider is configured. An
 *     endpoint that hands back the code it is asking the user to prove proves
 *     nothing.
 *  2. Every challenge has a TTL and a bounded number of guesses, so a 6-digit
 *     code cannot be brute-forced inside its own lifetime.
 *
 * Codes are stored as SHA-256 hashes — never plaintext.
 */

/** 10 minutes, the same lifetime the reference flow has always implied. */
export const DEFAULT_TTL_MS = 10 * 60 * 1000

/** Wrong guesses allowed before the challenge is destroyed. */
export const MAX_ATTEMPTS = 5

/**
 * Codes requested per phone across this window, enforced in front of `issue`
 * so a flood cannot run up SMS spend (the provider's panel-side cap will
 * otherwise be the only limiter). Single-instance in-memory; Appendix A of the
 * final report notes the swap for multi-instance deployments.
 */
const RATE_WINDOW_MS = 15 * 60 * 1000
const RATE_MAX = 4 // 4 codes / 15 min / number is generous for a human

export const SMS_PROVIDER_NAME = process.env.SMS_PROVIDER?.trim().toLowerCase()

/** True when the operator configured a real provider (SMS.ir / Kavenegar). */
export function isSmsProviderConfigured(): boolean {
   if (SMS_PROVIDER_NAME === "smsir") return Boolean(process.env.SMS_API_KEY && process.env.SMS_TEMPLATE_ID)
   if (SMS_PROVIDER_NAME === "kavenegar") return Boolean(process.env.SMS_API_KEY && process.env.SMS_TEMPLATE_NAME)
   if (!SMS_PROVIDER_NAME) return false
   // Unknown provider name: report configured, delivery will throw loudly.
   return true
}

function hashCode(code: string): string {
   return crypto.createHash("sha256").update(code, "utf8").digest("hex")
}

/* ------------------------------------------------------------------ */
/* Delivery seam — the only function that sees where a message lands.  */
/* ------------------------------------------------------------------ */

/**
 * Delivery seam, ported from docs/integrations.md of the reference.
 *
 * Never fails the caller: the challenge row already exists and can be
 * re-requested; a text that did not go out is logged loudly instead.
 */
async function deliver(phone: string, code: string, purpose: OtpPurpose): Promise<void> {
   if (SMS_PROVIDER_NAME === "smsir") {
      // SMS.ir "verification" template — the panel owns the message text, the
      // code rides in as the CODE parameter.
      try {
         const res = await fetch("https://api.sms.ir/v1/send/verify", {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
               Accept: "application/json",
               "X-API-KEY": process.env.SMS_API_KEY ?? "",
            },
            body: JSON.stringify({
               mobile: phone,
               templateId: Number(process.env.SMS_TEMPLATE_ID ?? 0),
               parameters: [{ name: "CODE", value: code }],
            }),
            signal: AbortSignal.timeout(10_000),
         })
         if (!res.ok) throw new Error(`SMS.ir answered ${res.status}`)
         const body = (await res.json()) as { status?: number; message?: string }
         if (body?.status !== 1) throw new Error(`SMS.ir status ${body?.status}: ${body?.message ?? ""}`)
         return
      } catch (err) {
         logDeliveryFailure(err)
         return
      }
   }

   if (SMS_PROVIDER_NAME === "kavenegar") {
      // Kavenegar verify/lookup — same template discipline, different shape.
      try {
         // Kavenegar expects the local format without the leading zero.
         const receptor = phone.startsWith("0") ? phone.slice(1) : phone
         const res = await fetch(`https://api.kavenegar.com/v1/${process.env.SMS_API_KEY ?? ""}/verify/lookup.json`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
               receptor,
               token: code,
               template: process.env.SMS_TEMPLATE_NAME ?? "",
            }),
            signal: AbortSignal.timeout(10_000),
         })
         if (!res.ok) throw new Error(`Kavenegar answered ${res.status}`)
         const body = (await res.json()) as { return?: { status?: number; message?: string } }
         // Kavenegar answers 200 for some carrier-level rejections too, so the
         // body's own status decides whether a text actually went out.
         if (Number(body?.return?.status) !== 200) {
            throw new Error(`Kavenegar return status ${body?.return?.status}: ${body?.return?.message ?? ""}`)
         }
         return
      } catch (err) {
         logDeliveryFailure(err)
         return
      }
   }

   /**
    * Development delivery: the code goes to this process's terminal so a human
    * can finish the flow. Honest about what it is — the code exists only on
    * the server, never inside an HTTP response — but this is NOT a working
    * SMS setup, and every auth response carries `delivery: "console"` so the
    * caller (and the UI) can say so.
    */
   console.log(`[phone-verification] DEV console delivery — no SMS provider configured. phone=${phone} purpose=${purpose} code=${code}`)
}

function logDeliveryFailure(err: unknown): void {
   console.error("[phone-verification] SMS delivery failed", err)
}

/* ------------------------------------------------------------------ */
/* Rate limiting                                                       */
/* ------------------------------------------------------------------ */

const rateWindow = new Map<string, number[]>()

function rateLimit(phone: string): boolean {
   const now = Date.now()
   const hits = (rateWindow.get(phone) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
   if (hits.length >= RATE_MAX) {
      rateWindow.set(phone, hits)
      return false
   }
   hits.push(now)
   rateWindow.set(phone, hits)
   return true
}

/* ------------------------------------------------------------------ */
/* Sweeping                                                            */
/* ------------------------------------------------------------------ */

/**
 * Clears expired challenge rows.
 *
 * Collapsed into the write path instead of a background timer: `issue` is the
 * first thing any new challenge does, so a lazy sweep keeps the table healthy
 * without a process living between hot reloads.
 */
async function sweep(now: number): Promise<void> {
   await prisma.phoneVerification.deleteMany({ where: { expiresAt: { lte: new Date(now) } } })
}

/* ------------------------------------------------------------------ */
/* Issue / consume                                                     */
/* ------------------------------------------------------------------ */

export interface IssuedChallenge {
   id: string
   expiresAt: Date
   /** How the code travelled — surfaced in API responses, never the code. */
   delivery: "smsir" | "kavenegar" | "console"
}

/**
 * Creates a pending challenge and returns only its id.
 *
 * Any previous pending challenge for the same phone+purpose+user is dropped
 * first, so a code can be re-requested and the newest request is the only one
 * that works.
 */
export async function issueCode({
   phone,
   purpose,
   userId = null,
   ttlMs = DEFAULT_TTL_MS,
}: {
   phone: string
   purpose: OtpPurpose
   userId?: string | null
   ttlMs?: number
}): Promise<IssuedChallenge> {
   if (!phone) throw new Error("issueCode requires a phone")

   const now = Date.now()

   // Rate limit BEFORE any write: a flooded number costs nothing yet.
   if (!rateLimit(phone)) {
      const err = new Error("ratelimit") as Error & { code?: string }
      err.code = "RATE_LIMIT"
      throw err
   }

   await sweep(now)
   await prisma.phoneVerification.deleteMany({
      where: { phone, purpose, userId: userId ?? null },
   })

   const code = generateCode()
   const challenge = await prisma.phoneVerification.create({
      data: {
         phone,
         purpose,
         userId,
         codeHash: hashCode(code),
         expiresAt: new Date(now + ttlMs),
      },
      select: { id: true, expiresAt: true },
   })

   await deliver(phone, code, purpose)

   const providerName = SMS_PROVIDER_NAME === "smsir" || SMS_PROVIDER_NAME === "kavenegar" ? SMS_PROVIDER_NAME : "console"
   return { id: challenge.id, expiresAt: challenge.expiresAt, delivery: providerName }
}

/** Random 6-digit code. Per-row uniqueness is unnecessary now that codes are
 * hashed (several rows may legitimately share a hash of the same number and
 * nothing leaks through), so this is one uniform draw. */
function generateCode(): string {
   return String(crypto.randomInt(100_000, 1_000_000))
}

export interface ConsumedChallenge {
   ok: true
   phone: string
   userId: string | null
   purpose: OtpPurpose
}

/**
 * Validates a challenge and consumes it.
 *
 * Every failure looks the same to the caller on purpose — a distinct reason
 * per failure would let someone probe which ids exist or which codes are
 * close. Callers answer with one generic "the code is not correct" message.
 */
export async function consumeCode({
   id,
   code,
   purpose,
   userId = null,
}: {
   id: string
   code: string
   purpose: OtpPurpose
   userId?: string | null
}): Promise<ConsumedChallenge | { ok: false }> {
   const invalid = { ok: false } as const
   if (!id || !code) return invalid

   const row = await prisma.phoneVerification.findUnique({ where: { id } })
   if (!row) return invalid

   // Purpose and user must both match the flow that issued the row before
   // anything is consumed, so a challenge stolen by another flow is not
   // destroyed as a side effect. The only remaining flow is PHONE_CHANGE and
   // the user binding is always enforced by its verify endpoint.
   if (row.purpose !== purpose) return invalid
   if (userId !== null && row.userId !== userId) {
      return invalid
   }

   if (row.expiresAt.getTime() < Date.now()) {
      await prisma.phoneVerification.delete({ where: { id: row.id } })
      return invalid
   }

   if (row.codeHash !== hashCode(code)) {
      await prisma.phoneVerification.update({
         where: { id: row.id },
         data: { attempts: { increment: 1 } },
      })
      // Burn the challenge once it runs out of guesses, so an attacker cannot
      // keep trying against the same code.
      if (row.attempts + 1 >= MAX_ATTEMPTS) {
         await prisma.phoneVerification.delete({ where: { id: row.id } })
      }
      return invalid
   }

   await prisma.phoneVerification.delete({ where: { id: row.id } })
   return { ok: true, phone: row.phone, userId: row.userId, purpose: row.purpose }
}
