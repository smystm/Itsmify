import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser, invalidBody } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { adminUpdateTicketSchema } from "@/lib/tickets/validation"
import { getAdminTicketDetail, ticketErrorResponse, updateAdminTicket } from "@/lib/tickets/service"

type TicketRouteContext = { params: Promise<{ id: string }> }

/** GET /api/admin/tickets/[id] — full ticket, including internal comments and history. */
export async function GET(request: NextRequest, ctx: TicketRouteContext) {
   const guard = await apiRequireRole(request, "tickets.read.all")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   try {
      const { id } = await ctx.params
      const ticket = await getAdminTicketDetail(viewer, id)
      return NextResponse.json({ ticket })
   } catch (err) {
      return ticketErrorResponse(err)
   }
}

/** PATCH /api/admin/tickets/[id] — content while NEW; priority/category while non-terminal. */
export async function PATCH(request: NextRequest, ctx: TicketRouteContext) {
   const guard = await apiRequireRole(request, "tickets.update")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   let body: unknown
   try {
      body = await request.json()
   } catch {
      return invalidBody()
   }

   const parsed = await validate(adminUpdateTicketSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const { id } = await ctx.params
      const ticket = await updateAdminTicket(viewer, id, parsed.value)
      return NextResponse.json({ ticket })
   } catch (err) {
      return ticketErrorResponse(err)
   }
}
