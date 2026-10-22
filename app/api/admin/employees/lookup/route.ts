import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, toErrorResponse } from "@/lib/auth/https"
import { lookupEmployees } from "@/lib/employees/service"

/**
 * Employee picker used by the asset assignment dialog. Asset managers need to
 * see names, so this is deliberately guarded by `equipment.read` rather than
 * the SYS_ADMIN-only employee-management actions.
 */
export async function GET(request: NextRequest) {
   const guard = await apiRequireRole(request, "equipment.read")
   if (guard) return guard

   try {
      const params = request.nextUrl.searchParams
      const employees = await lookupEmployees(params.get("q") ?? "", 20)
      return NextResponse.json({ employees })
   } catch (err) {
      return toErrorResponse(err)
   }
}
