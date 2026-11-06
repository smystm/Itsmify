import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser, invalidBody } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { assignTicketSchema } from "@/lib/tickets/validation"
import { assignAdminTicket, ticketErrorResponse } from "@/lib/tickets/service"

type TicketRouteContext = { params: Promise<{ id: string }> }

/** POST /api/admin/tickets/[id]/assign — claim, assign or reassign. */
export async function POST(request: NextRequest, ctx: TicketRouteContext) {
   const guard = await apiRequireRole(request, "tickets.assign")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   let body: unknown
   try {
      body = await request.json()
   } catch {
      return invalidBody()
   }

   const parsed = await validate(assignTicketSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const { id } = await ctx.params
      const ticket = await assignAdminTicket(viewer, id, parsed.value)
      return NextResponse.json({ ticket })
   } catch (err) {
      return ticketErrorResponse(err)
   }
}
