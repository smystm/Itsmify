import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser } from "@/lib/auth/https"
import { getAdminTicketOptions, ticketErrorResponse } from "@/lib/tickets/service"

/** GET /api/admin/tickets/options — active categories and eligible IT assignees. */
export async function GET(request: NextRequest) {
   const guard = await apiRequireRole(request, "tickets.read.all")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   try {
      return NextResponse.json(await getAdminTicketOptions(viewer))
   } catch (err) {
      return ticketErrorResponse(err)
   }
}
