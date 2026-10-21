import "server-only"
import crypto from "node:crypto"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

/**
 * Server-side session management.
 *
 * The reference stored a JWT in a `users.token` column — which could never be
 * revoked and expired invisibly. This port keeps the credential out of the
 * user row entirely: the browser holds a random opaque token, the database
 * holds its SHA-256 hash, and every read re-validates against `expires_at`.
 * Logout, rejection and role changes revoke rows instead of "waiting for the
 * 10 days".
 */

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "itsm_session"

/** Fixed lifetime, in days. Also the cookie's Max-Age. */
export const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS) > 0 ? Number(process.env.SESSION_TTL_DAYS) : 14
export const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000

/** True only when running under HTTPS wiring — mirrored into Secure cookies. */
const secureCookie = process.env.NODE_ENV === "production"

/**
 * The narrow shape every consumer is allowed to see. Session token hashes,
 * password hashes, review notes and so on never travel past this boundary.
 */
export interface SessionUser {
   id: string
   username: string
   firstName: string
   lastName: string
   phone: string | null
   role: "EMPLOYEE" | "IT_SPECIALIST" | "IT_MANAGER" | "SYS_ADMIN"
   status: "ACTIVE" | "SUSPENDED"
   mustChangePassword: boolean
   createdAt: Date
}

export function hashToken(token: string): string {
   return crypto.createHash("sha256").update(token, "utf8").digest("hex")
}

/**
 * Creates a session for an active user and returns the token to cookie.
 *
 * `context` is request metadata for the admin's audit trail — captured once,
 * never sent back to the client.
 */
export async function createSession(
   userId: string,
   context: { userAgent?: string | null; ip?: string | null },
): Promise<{ token: string; expiresAt: Date }> {
   // 256 bits of CSPRNG: collision improbable, guessing impossible.
   const token = crypto.randomBytes(32).toString("base64url")
   const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

   await prisma.session.create({
      data: {
         userId,
         tokenHash: hashToken(token),
         expiresAt,
         userAgent: context.userAgent?.slice(0, 255) ?? null,
         ip: context.ip ?? null,
      },
   })

   return { token, expiresAt }
}

/**
 * Reads the session cookie and resolves an ACTIVE session.
 *
 * "Active" means: row exists, not revoked, not expired, its user is not
 * soft-deleted, and the account is ACTIVE. A suspended or deleted account
 * loses access here, at the read, in the same way it loses access at login —
 * one consistent gate for every page and API.
 */
export async function readSessionUser(context?: {
   cookieStore?: ReturnType<typeof cookies> extends Promise<infer T> ? T : never
   keepAliveIdle?: boolean
}): Promise<SessionUser | null> {
   const token = await readSessionToken(context)
   if (!token) return null

   return sessionUserByToken(token)
}

async function readSessionToken(context?: { cookieStore?: Awaited<ReturnType<typeof cookies>> }): Promise<string | undefined> {
   const cookieStore = context?.cookieStore ?? (await cookies())
   return cookieStore.get(SESSION_COOKIE_NAME)?.value
}

const sessionUserSelect = {
   id: true,
   username: true,
   firstName: true,
   lastName: true,
   phone: true,
   role: true,
   status: true,
   mustChangePassword: true,
   createdAt: true,
   deletedAt: true,
} as const

export async function sessionUserByToken(token: string): Promise<SessionUser | null> {
   const now = new Date()

   const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { user: { select: sessionUserSelect }, expiresAt: true, revokedAt: true },
   })

   if (!session || session.revokedAt || session.expiresAt < now) return null
   // Suspended and soft-deleted accounts never authenticate.
   if (session.user.status !== "ACTIVE" || session.user.deletedAt) return null

   const user = session.user
   return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
   }
}

/** Ends one session (logout). Deleting the row drops the credential for good;
 * nothing accumulates that needs a sweeper for correctness. */
export async function destroySession(token: string): Promise<void> {
   await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } })
}

/** Ends every session a user holds — used on suspension, deletion, password
 * resets and role changes. */
export async function destroyAllSessions(userId: string): Promise<void> {
   await prisma.session.deleteMany({ where: { userId } })
}

/** Ends every session except the one making the change (self password edit). */
export async function destroyOtherSessions(userId: string, keepToken: string): Promise<void> {
   await prisma.session.deleteMany({ where: { userId, tokenHash: { not: hashToken(keepToken) } } })
}

/** Sweeps expired sessions. Called from the admin endpoints' GET path only. */
export async function sweepExpiredSessions(): Promise<void> {
   await prisma.session.deleteMany({ where: { expiresAt: { lte: new Date() } } })
}

/** Writes the session cookie onto a response (route handlers only). */
export function sessionCookieOptions(expiresAt: Date) {
   return {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: secureCookie,
      path: "/",
      expires: expiresAt,
   }
}

export function clearSessionCookieOptions() {
   return {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: secureCookie,
      path: "/",
      maxAge: 0,
   }
}
