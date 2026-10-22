import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser, invalidBody, toErrorResponse } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { updateEmployeeSchema } from "@/lib/employees/validation"
import {
   deleteEmployee,
   employeeErrorResponse,
   getEmployeeDetail,
   updateEmployee,
} from "@/lib/employees/service"

type UserRouteContext = { params: Promise<{ id: string }> }

/** GET /api/admin/users/[id] — full employee profile, active assets and audit. */
export async function GET(request: NextRequest, ctx: UserRouteContext) {
   const guard = await apiRequireRole(request, "admin.users.read")
   if (guard) return guard

   try {
      const { id } = await ctx.params
      const employee = await getEmployeeDetail(id)
      if (!employee) return NextResponse.json({ error: "not_found" }, { status: 404 })
      return NextResponse.json({ employee, user: employee })
   } catch (err) {
      return toErrorResponse(err)
   }
}

/**
 * PATCH /api/admin/users/[id] — edit account and organizational profile.
 *
 * Guardrails in the service:
 *   * an administrator cannot suspend or demote their own account;
 *   * the last ACTIVE SYS_ADMIN cannot be demoted or suspended;
 *   * role/status changes revoke every session the target holds;
 *   * a phone change clears phone verification and pending challenges.
 */
export async function PATCH(request: NextRequest, ctx: UserRouteContext) {
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

   const parsed = await validate(updateEmployeeSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const { id } = await ctx.params
      const employee = await updateEmployee(id, parsed.value, viewer)
      return NextResponse.json({ employee, user: employee })
   } catch (err) {
      return employeeErrorResponse(err)
   }
}

/**
 * DELETE /api/admin/users/[id] — soft delete, blocked while assets are active.
 * The row survives so audit history and assignment records stay coherent.
 */
export async function DELETE(request: NextRequest, ctx: UserRouteContext) {
   const guard = await apiRequireRole(request, "admin.users.delete")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   try {
      const { id } = await ctx.params
      await deleteEmployee(id, viewer)
      return NextResponse.json({ ok: true })
   } catch (err) {
      return employeeErrorResponse(err)
   }
}
