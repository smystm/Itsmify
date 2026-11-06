import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser, invalidBody } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { employeeStatusSchema } from "@/lib/tickets/validation"
import { changeMyTicketStatus, ticketErrorResponse } from "@/lib/tickets/service"

type TicketRouteContext = { params: Promise<{ id: string }> }

/** POST /api/panel/tickets/[id]/status — cancel NEW, close or reopen RESOLVED. */
export async function POST(request: NextRequest, ctx: TicketRouteContext) {
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

   const parsed = await validate(employeeStatusSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const { id } = await ctx.params
      const ticket = await changeMyTicketStatus(viewer, id, parsed.value)
      return NextResponse.json({ ticket })
   } catch (err) {
      return ticketErrorResponse(err)
   }
}
