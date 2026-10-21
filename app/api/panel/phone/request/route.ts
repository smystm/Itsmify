import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiSessionUser, invalidBody, passwordChangeRequired, toErrorResponse } from "@/lib/auth/https"
import { can } from "@/lib/auth/permissions"
import { issueCode } from "@/lib/auth/otp"
import { normalizedPhone, phoneChangeRequestSchema, validate } from "@/lib/auth/validation"
import { fa } from "@/lib/i18n/fa"

/**
 * POST /api/panel/phone/request — step 1 of proving a new phone number.
 *
 * Admin-created accounts may already have a phone, but admins set it as
 * unverified profile data. Only this OTP exchange marks it verified.
 */
export async function POST(request: NextRequest) {
   const user = await apiSessionUser(request)
   if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
   if (!can(user.role, "profile.phone.change")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
   }
   const blocked = passwordChangeRequired(user)
   if (blocked) return blocked

   let body: unknown
   try {
      body = await request.json()
   } catch {
      return invalidBody()
   }

   const parsed = await validate(phoneChangeRequestSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   const phone = normalizedPhone(parsed.value.phone)

   try {
      const [owner, ownPhone] = await Promise.all([
         prisma.user.findUnique({ where: { phone }, select: { id: true } }),
         prisma.user.findUnique({
            where: { id: user.id },
            select: { phone: true, phoneVerifiedAt: true },
         }),
      ])

      if (owner && owner.id !== user.id) {
         return invalidBody({ phone: fa.profile.phoneTaken })
      }

      // The same number can be re-requested while it is still unverified —
      // administrators may have entered it as profile data without proving
      // ownership. Once verified, repeating it is a no-op, not a new change.
      if (phone === ownPhone?.phone && ownPhone.phoneVerifiedAt) {
         return invalidBody({ phone: fa.profile.phoneAlreadySet })
      }

      // Only one live phone-change challenge per account.
      await prisma.phoneVerification.deleteMany({ where: { userId: user.id, purpose: "PHONE_CHANGE" } })

      const challenge = await issueCode({ phone, purpose: "PHONE_CHANGE", userId: user.id })
      return NextResponse.json({
         challengeId: challenge.id,
         expiresAt: challenge.expiresAt.toISOString(),
         delivery: challenge.delivery,
         phone,
      })
   } catch (err) {
      return toErrorResponse(err)
   }
}
