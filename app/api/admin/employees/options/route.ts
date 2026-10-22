import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireAnyAction, toErrorResponse } from "@/lib/auth/https"
import { listOrgUnits } from "@/lib/employees/service"

/** Shared option lists for the employee and asset forms/filters. */
export async function GET(request: NextRequest) {
   const guard = await apiRequireAnyAction(request, "admin.users.read", "equipment.read")
   if (guard) return guard

   try {
      const orgUnits = await listOrgUnits()
      return NextResponse.json({ orgUnits })
   } catch (err) {
      return toErrorResponse(err)
   }
}
