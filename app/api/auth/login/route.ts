import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/auth/password"
import { createSession, sessionCookieOptions, sweepExpiredSessions } from "@/lib/auth/session"
import { loginSchema, validate } from "@/lib/auth/validation"
import { invalidBody, requestContext, toErrorResponse } from "@/lib/auth/https"
import { clearLoginFailures, isLoginThrottled, recordLoginFailure } from "@/lib/auth/login-rate-limit"

/**
 * POST /api/auth/login — username + password.
 *
 * Accounts are created by administrators; there is no self-registration and
 * no OTP login. The response is deliberately generic on failure so it cannot
 * be used to enumerate usernames, and an unknown username still runs a full
 * scrypt verification (against a dummy hash) to keep timing flat.
 */
export async function POST(request: NextRequest) {
   let body: unknown
   try {
      body = await request.json()
   } catch {
      return invalidBody()
   }

   const parsed = await validate(loginSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   const { username, password } = parsed.value
   const { ip } = requestContext(request)
   const throttleKey = `${username}|${ip ?? "unknown"}`

   if (isLoginThrottled(throttleKey)) {
      return NextResponse.json({ error: "rate_limited", code: "RATE_LIMIT" }, { status: 429 })
   }

   try {
      const user = await prisma.user.findUnique({
         where: { username },
         select: {
            id: true,
            passwordHash: true,
            status: true,
            deletedAt: true,
            mustChangePassword: true,
         },
      })

      // Always pay the hashing cost, even when the username is unknown or the
      // account has no password yet.
      const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH)

      if (!user || !user.passwordHash || !passwordOk || user.deletedAt) {
         recordLoginFailure(throttleKey)
         return NextResponse.json({ error: "invalid_credentials" }, { status: 401 })
      }

      if (user.status !== "ACTIVE") {
         recordLoginFailure(throttleKey)
         return NextResponse.json({ error: "suspended", code: "SUSPENDED" }, { status: 403 })
      }

      clearLoginFailures(throttleKey)

      try {
         await sweepExpiredSessions()
      } catch {
         // Housekeeping must never block a valid sign-in.
      }

      const { token, expiresAt } = await createSession(user.id, requestContext(request))
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })

      const res = NextResponse.json({
         status: "ok",
         mustChangePassword: user.mustChangePassword,
      })
      res.cookies.set(process.env.SESSION_COOKIE_NAME || "itsm_session", token, sessionCookieOptions(expiresAt))
      return res
   } catch (err) {
      return toErrorResponse(err)
   }
}
