import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireAnyAction, apiSessionUser, toErrorResponse } from "@/lib/auth/https"
import { can } from "@/lib/auth/permissions"
import { getEmployeeStats, listEmployees } from "@/lib/employees/service"
import { getAssetStats, getRecentAssets } from "@/lib/assets/service"

/**
 * Real dashboard counters. Nothing here is invented: every number is a
 * database count scoped to the caller's permissions. IT roles see only the
 * asset half; SYS_ADMIN sees both.
 */
export async function GET(request: NextRequest) {
   const guard = await apiRequireAnyAction(request, "admin.users.read", "equipment.read")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   const canReadEmployees = can(viewer.role, "admin.users.read")
   const canReadAssets = can(viewer.role, "equipment.read")
   const canWriteAssets = can(viewer.role, "equipment.write")

   try {
      const [employeeStats, recentEmployees, assetStats, recentAssets] = await Promise.all([
         canReadEmployees ? getEmployeeStats() : Promise.resolve(null),
         canReadEmployees ? listEmployees({ page: 1, pageSize: 5, sort: "newest" }) : Promise.resolve(null),
         canReadAssets ? getAssetStats() : Promise.resolve(null),
         canReadAssets ? getRecentAssets(5) : Promise.resolve(null),
      ])

      return NextResponse.json({
         permissions: {
            employees: canReadEmployees,
            assets: canReadAssets,
            writeAssets: canWriteAssets,
         },
         employees:
            employeeStats && recentEmployees
               ? { stats: employeeStats, recent: recentEmployees.employees }
               : null,
         assets: assetStats && recentAssets ? { stats: assetStats, recent: recentAssets } : null,
      })
   } catch (err) {
      return toErrorResponse(err)
   }
}
