import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiSessionUser, invalidBody, toErrorResponse } from "@/lib/auth/https"
import { can } from "@/lib/auth/permissions"
import { passwordChangeSchema, validate } from "@/lib/auth/validation"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { hashToken, SESSION_COOKIE_NAME } from "@/lib/auth/session"
import { fa } from "@/lib/i18n/fa"

/**
 * POST /api/panel/password — change your own password.
 *
 * Requires the current password even when the account is in the forced-change
 * state: knowing the temporary credential is the proof. Other sessions are
 * revoked so a leaked old cookie cannot outlive the change.
 */
export async function POST(request: NextRequest) {
   const user = await apiSessionUser(request)
   if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
   if (!can(user.role, "profile.password.change")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
   }
   // Note: this endpoint is deliberately reachable before the forced change.

   let body: unknown
   try {
      body = await request.json()
   } catch {
      return invalidBody()
   }

   const parsed = await validate(passwordChangeSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   const { currentPassword, newPassword } = parsed.value

   try {
      const row = await prisma.user.findUnique({
         where: { id: user.id },
         select: { passwordHash: true },
      })

      if (!row?.passwordHash) {
         return NextResponse.json({ error: "password_not_set" }, { status: 409 })
      }

      const currentOk = await verifyPassword(currentPassword, row.passwordHash)
      if (!currentOk) {
         return invalidBody({ currentPassword: fa.changePassword.currentWrong })
      }

      if (currentPassword === newPassword) {
         return invalidBody({ newPassword: fa.changePassword.samePassword })
      }

      const passwordHash = await hashPassword(newPassword)
      const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

      await prisma.$transaction(async (tx) => {
         await tx.user.update({
            where: { id: user.id },
            data: {
               passwordHash,
               mustChangePassword: false,
               passwordChangedAt: new Date(),
            },
         })
         if (token) {
            // Preserve the session that made the change, revoke every other.
            await tx.session.deleteMany({
               where: {
                  userId: user.id,
                  NOT: { tokenHash: hashToken(token) },
               },
            })
         }
         await tx.accountAudit.create({
            data: {
               actorId: user.id,
               targetUserId: user.id,
               action: "PASSWORD_CHANGED",
               detail: { method: "self" },
            },
         })
      })

      // The transaction keeps the hash change, session revocations and audit
      // row atomic; no half-applied security state is possible.
      return NextResponse.json({ ok: true })
   } catch (err) {
      return toErrorResponse(err)
   }
}
