import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { apiRequireRole, apiSessionUser, invalidBody, toErrorResponse } from "@/lib/auth/https"
import { normalizedPhone, updateUserSchema, validate } from "@/lib/auth/validation"
import type { Role } from "@/lib/auth/permissions"
import { adminUserSelect, toAdminUserDto } from "@/lib/admin/users"
import { fa } from "@/lib/i18n/fa"

/**
 * PATCH /api/admin/users/[id] — edit account information.
 *
 * Guardrails that cannot be expressed by the form:
 *   * an administrator cannot suspend or demote their own account;
 *   * the last ACTIVE SYS_ADMIN cannot be demoted or suspended;
 *   * role/status changes revoke every session the target holds.
 *
 * Passwords are never part of this payload — reset is a separate endpoint so
 * the one-time credential workflow stays explicit.
 */
export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/users/[id]">) {
   const guard = await apiRequireRole(request, "admin.users.update")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   let body: unknown
   try {
      body = await request.json()
   } catch {
      return invalidBody()
   }

   const parsed = await validate(updateUserSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   const { id } = await ctx.params
   const { firstName, lastName, username } = parsed.value
   const role = parsed.value.role as Role
   const status = parsed.value.status as "ACTIVE" | "SUSPENDED"
   const phone = parsed.value.phone ? normalizedPhone(parsed.value.phone) : null

   try {
      const target = await prisma.user.findUnique({ where: { id }, select: adminUserSelect })
      if (!target || target.deletedAt) {
         return NextResponse.json({ error: "not_found" }, { status: 404 })
      }

      if (viewer.id === target.id && (role !== target.role || status !== target.status)) {
         return NextResponse.json({ error: "self_protected", code: "SELF" }, { status: 400 })
      }

      const losesAdmin =
         target.role === "SYS_ADMIN" &&
         target.status === "ACTIVE" &&
         (role !== "SYS_ADMIN" || status !== "ACTIVE")
      if (losesAdmin) {
         const otherAdmins = await prisma.user.count({
            where: {
               id: { not: target.id },
               role: "SYS_ADMIN",
               status: "ACTIVE",
               deletedAt: null,
            },
         })
         if (otherAdmins === 0) {
            return NextResponse.json({ error: "last_admin", code: "LAST_ADMIN" }, { status: 409 })
         }
      }

      if (username !== target.username) {
         const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } })
         if (existing && existing.id !== target.id) {
            return invalidBody({ username: fa.admin.usernameTaken })
         }
      }

      if (phone && phone !== target.phone) {
         const existing = await prisma.user.findUnique({ where: { phone }, select: { id: true } })
         if (existing && existing.id !== target.id) {
            return invalidBody({ phone: fa.admin.phoneTaken })
         }
      }

      const phoneChanged = (target.phone ?? null) !== phone
      const roleChanged = target.role !== role
      const statusChanged = target.status !== status
      const profileFields = [
         firstName !== target.firstName ? "firstName" : null,
         lastName !== target.lastName ? "lastName" : null,
         username !== target.username ? "username" : null,
         phoneChanged ? "phone" : null,
      ].filter((field): field is string => field !== null)

      const updated = await prisma.$transaction(async (tx) => {
         const user = await tx.user.update({
            where: { id: target.id },
            data: {
               firstName,
               lastName,
               username,
               phone,
               role,
               status,
               ...(phoneChanged ? { phoneVerifiedAt: null } : {}),
            },
            select: adminUserSelect,
         })

         if (profileFields.length > 0) {
            await tx.accountAudit.create({
               data: {
                  actorId: viewer.id,
                  targetUserId: target.id,
                  action: "UPDATED",
                  detail: { fields: profileFields, phoneChanged },
               },
            })
         }
         if (roleChanged) {
            await tx.accountAudit.create({
               data: {
                  actorId: viewer.id,
                  targetUserId: target.id,
                  action: "ROLE_CHANGED",
                  detail: { from: target.role, to: role },
               },
            })
         }
         if (statusChanged) {
            await tx.accountAudit.create({
               data: {
                  actorId: viewer.id,
                  targetUserId: target.id,
                  action: "STATUS_CHANGED",
                  detail: { from: target.status, to: status },
               },
            })
         }

         if (roleChanged || statusChanged) {
            await tx.session.deleteMany({ where: { userId: target.id } })
         }
         if (phoneChanged) {
            await tx.phoneVerification.deleteMany({ where: { userId: target.id, purpose: "PHONE_CHANGE" } })
         }

         return user
      })

      return NextResponse.json({ user: toAdminUserDto(updated) })
   } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
         const targetField = String(err.meta?.target ?? "")
         return invalidBody(
            targetField.includes("phone") ? { phone: fa.admin.phoneTaken } : { username: fa.admin.usernameTaken },
         )
      }
      return toErrorResponse(err)
   }
}

/**
 * DELETE /api/admin/users/[id] — soft delete.
 *
 * The row survives (barred from login, sessions and pending challenges
 * revoked) so audit history and any future references stay coherent.
 */
export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/admin/users/[id]">) {
   const guard = await apiRequireRole(request, "admin.users.delete")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   const { id } = await ctx.params

   try {
      const target = await prisma.user.findUnique({
         where: { id },
         select: { id: true, role: true, status: true, deletedAt: true },
      })
      if (!target || target.deletedAt) {
         return NextResponse.json({ error: "not_found" }, { status: 404 })
      }
      if (viewer.id === target.id) {
         return NextResponse.json({ error: "self_protected", code: "SELF" }, { status: 400 })
      }

      if (target.role === "SYS_ADMIN" && target.status === "ACTIVE") {
         const otherAdmins = await prisma.user.count({
            where: {
               id: { not: target.id },
               role: "SYS_ADMIN",
               status: "ACTIVE",
               deletedAt: null,
            },
         })
         if (otherAdmins === 0) {
            return NextResponse.json({ error: "last_admin", code: "LAST_ADMIN" }, { status: 409 })
         }
      }

      await prisma.$transaction(async (tx) => {
         await tx.user.update({
            where: { id: target.id },
            data: { deletedAt: new Date(), deletedById: viewer.id, status: "SUSPENDED" },
         })
         await tx.session.deleteMany({ where: { userId: target.id } })
         await tx.phoneVerification.deleteMany({ where: { userId: target.id } })
         await tx.accountAudit.create({
            data: {
               actorId: viewer.id,
               targetUserId: target.id,
               action: "DELETED",
               detail: { softDelete: true },
            },
         })
      })

      return NextResponse.json({ ok: true })
   } catch (err) {
      return toErrorResponse(err)
   }
}
