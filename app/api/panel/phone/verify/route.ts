import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { apiSessionUser, invalidBody, invalidCode, passwordChangeRequired, toErrorResponse } from "@/lib/auth/https"
import { can } from "@/lib/auth/permissions"
import { consumeCode } from "@/lib/auth/otp"
import { phoneChangeVerifySchema, validate } from "@/lib/auth/validation"
import { fa } from "@/lib/i18n/fa"

/**
 * POST /api/panel/phone/verify — step 2: consume the code and store the
 * verified number. The challenge is bound to this user and purpose; a code
 * issued for another account cannot be replayed here.
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

   const parsed = await validate(phoneChangeVerifySchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   const consumed = await consumeCode({
      id: parsed.value.challengeId,
      code: parsed.value.code,
      purpose: "PHONE_CHANGE",
      userId: user.id,
   })
   if (!consumed.ok) return invalidCode()

   try {
      const owner = await prisma.user.findUnique({ where: { phone: consumed.phone }, select: { id: true } })
      if (owner && owner.id !== user.id) {
         return invalidBody({ phone: fa.profile.phoneTaken })
      }

      await prisma.$transaction(async (tx) => {
         await tx.user.update({
            where: { id: user.id },
            data: { phone: consumed.phone, phoneVerifiedAt: new Date() },
         })
         await tx.phoneVerification.deleteMany({ where: { userId: user.id, purpose: "PHONE_CHANGE" } })
         await tx.accountAudit.create({
            data: {
               actorId: user.id,
               targetUserId: user.id,
               action: "PHONE_VERIFIED",
               detail: { phone: consumed.phone },
            },
         })
      })

      return NextResponse.json({ ok: true, phone: consumed.phone })
   } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
         return invalidBody({ phone: fa.profile.phoneTaken })
      }
      return toErrorResponse(err)
   }
}
