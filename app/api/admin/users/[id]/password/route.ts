import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiRequireRole, apiSessionUser, toErrorResponse } from "@/lib/auth/https"
import { generateTemporaryPassword, hashPassword } from "@/lib/auth/password"

/**
 * POST /api/admin/users/[id]/password — issue a temporary password.
 *
 * The administrator never sees the existing password (only a one-way hash
 * exists). This endpoint generates a fresh strong secret, stores its hash,
 * forces a change at next sign-in, revokes every session, and returns the
 * plaintext exactly once so the administrator can hand it to the user.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/users/[id]/password">) {
   const guard = await apiRequireRole(request, "admin.users.password")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   const { id } = await ctx.params

   try {
      const target = await prisma.user.findUnique({
         where: { id },
         select: { id: true, username: true, deletedAt: true },
      })
      if (!target || target.deletedAt) {
         return NextResponse.json({ error: "not_found" }, { status: 404 })
      }
      if (target.id === viewer.id) {
         return NextResponse.json({ error: "self_password_reset", code: "SELF" }, { status: 400 })
      }

      const password = generateTemporaryPassword(16)
      const passwordHash = await hashPassword(password)

      await prisma.$transaction(async (tx) => {
         await tx.user.update({
            where: { id: target.id },
            data: {
               passwordHash,
               mustChangePassword: true,
               passwordChangedAt: null,
            },
         })
         await tx.session.deleteMany({ where: { userId: target.id } })
         await tx.accountAudit.create({
            data: {
               actorId: viewer.id,
               targetUserId: target.id,
               action: "PASSWORD_RESET",
               detail: { forcedChange: true },
            },
         })
      })

      return NextResponse.json({ username: target.username, password })
   } catch (err) {
      return toErrorResponse(err)
   }
}
