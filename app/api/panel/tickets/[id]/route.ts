import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser, invalidBody } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { employeeUpdateTicketSchema } from "@/lib/tickets/validation"
import { getMyTicketDetail, ticketErrorResponse, updateMyTicket } from "@/lib/tickets/service"

type TicketRouteContext = { params: Promise<{ id: string }> }

/** GET /api/panel/tickets/[id] — own ticket with public comments and history. */
export async function GET(request: NextRequest, ctx: TicketRouteContext) {
   const guard = await apiRequireRole(request, "tickets.read.own")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   try {
      const { id } = await ctx.params
      const ticket = await getMyTicketDetail(viewer, id)
      return NextResponse.json({ ticket })
   } catch (err) {
      return ticketErrorResponse(err)
   }
}

/** PATCH /api/panel/tickets/[id] — edit content while the ticket is NEW. */
export async function PATCH(request: NextRequest, ctx: TicketRouteContext) {
   const guard = await apiRequireRole(request, "tickets.read.own")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   let body: unknown
   try {
      body = await request.json()
   } catch {
      return invalidBody()
   }

   const parsed = await validate(employeeUpdateTicketSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const { id } = await ctx.params
      const ticket = await updateMyTicket(viewer, id, parsed.value)
      return NextResponse.json({ ticket })
   } catch (err) {
      return ticketErrorResponse(err)
   }
}
