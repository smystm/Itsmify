import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser, invalidBody } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { employeeStatusSchema } from "@/lib/employees/validation"
import { employeeErrorResponse, setEmployeeStatus } from "@/lib/employees/service"

type StatusRouteContext = { params: Promise<{ id: string }> }

/** PATCH /api/admin/users/[id]/status — quick suspend/activate with guards. */
export async function PATCH(request: NextRequest, ctx: StatusRouteContext) {
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

   const parsed = await validate(employeeStatusSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const { id } = await ctx.params
      const employee = await setEmployeeStatus(id, parsed.value.status as "ACTIVE" | "SUSPENDED", viewer)
      return NextResponse.json({ employee, user: employee })
   } catch (err) {
      return employeeErrorResponse(err)
   }
}
