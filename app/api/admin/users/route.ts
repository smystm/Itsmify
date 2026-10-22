import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser, invalidBody } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { createEmployeeSchema } from "@/lib/employees/validation"
import {
   createEmployee,
   employeeErrorResponse,
   listEmployees,
} from "@/lib/employees/service"
import { toErrorResponse } from "@/lib/auth/https"

/**
 * Employee directory. The route keeps the existing `/api/admin/users` URL so
 * older links and the account panel remain valid; the payload now carries the
 * 1:1 EmployeeProfile alongside the account fields.
 */
export async function GET(request: NextRequest) {
   const guard = await apiRequireRole(request, "admin.users.read")
   if (guard) return guard

   try {
      const params = request.nextUrl.searchParams
      const result = await listEmployees({
         q: params.get("q") ?? undefined,
         role: params.get("role") ?? undefined,
         status: params.get("status") ?? undefined,
         orgUnitId: params.get("orgUnitId") ?? undefined,
         archived: params.get("archived") === "1",
         page: Number(params.get("page") ?? "1"),
         pageSize: Number(params.get("pageSize") ?? "20"),
         sort: params.get("sort") ?? undefined,
      })

      return NextResponse.json({
         ...result,
         // Keep the old key while the new employee UI migrates to `employees`.
         users: result.employees,
      })
   } catch (err) {
      return toErrorResponse(err)
   }
}

/**
 * POST /api/admin/users — provision an employee account and profile together.
 * The administrator either supplies an initial password or the server
 * generates one and returns it exactly once.
 */
export async function POST(request: NextRequest) {
   const guard = await apiRequireRole(request, "admin.users.create")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   let body: unknown
   try {
      body = await request.json()
   } catch {
      return invalidBody()
   }

   const parsed = await validate(createEmployeeSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const result = await createEmployee(parsed.value, viewer)
      return NextResponse.json(
         {
            employee: result.employee,
            // Compatibility aliases for the existing account panel.
            user: result.employee,
            initialPassword: result.initialPassword,
         },
         { status: 201 },
      )
   } catch (err) {
      return employeeErrorResponse(err)
   }
}
