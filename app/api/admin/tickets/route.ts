import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser } from "@/lib/auth/https"
import { listAdminTickets, ticketErrorResponse } from "@/lib/tickets/service"

/** GET /api/admin/tickets — the IT queue with filters, pagination and workload stats. */
export async function GET(request: NextRequest) {
   const guard = await apiRequireRole(request, "tickets.read.all")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   try {
      const params = request.nextUrl.searchParams
      const assigned = params.get("assigned")
      const result = await listAdminTickets(viewer, {
         q: params.get("q") ?? undefined,
         status: params.get("status") ?? undefined,
         type: params.get("type") ?? undefined,
         priority: params.get("priority") ?? undefined,
         categoryId: params.get("categoryId") ?? undefined,
         assigneeId: params.get("assigneeId") ?? undefined,
         assigned:
            assigned === "unassigned" || assigned === "mine" || assigned === "assigned" ? assigned : undefined,
         page: Number(params.get("page") ?? "1"),
         pageSize: Number(params.get("pageSize") ?? "20"),
         sort: params.get("sort") ?? undefined,
      })
      return NextResponse.json(result)
   } catch (err) {
      return ticketErrorResponse(err)
   }
}
