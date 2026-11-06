import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireAnyAction, apiSessionUser } from "@/lib/auth/https"
import { getMyTicketOptions, ticketErrorResponse } from "@/lib/tickets/service"

/** GET /api/panel/tickets/options — active categories for the employee form. */
export async function GET(request: NextRequest) {
   const guard = await apiRequireAnyAction(request, "tickets.submit", "tickets.read.own")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   try {
      return NextResponse.json(await getMyTicketOptions(viewer))
   } catch (err) {
      return ticketErrorResponse(err)
   }
}
