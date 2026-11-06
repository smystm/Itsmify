import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser, invalidBody } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { createTicketSchema } from "@/lib/tickets/validation"
import { createTicket, listMyTickets, ticketErrorResponse } from "@/lib/tickets/service"

/** GET /api/panel/tickets — the signed-in employee's own tickets. */
export async function GET(request: NextRequest) {
   const guard = await apiRequireRole(request, "tickets.read.own")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   try {
      const params = request.nextUrl.searchParams
      const assigned = params.get("assigned")
      const result = await listMyTickets(viewer, {
         q: params.get("q") ?? undefined,
         status: params.get("status") ?? undefined,
         type: params.get("type") ?? undefined,
         priority: params.get("priority") ?? undefined,
         categoryId: params.get("categoryId") ?? undefined,
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

/** POST /api/panel/tickets — submit a ticket as the signed-in user. */
export async function POST(request: NextRequest) {
   const guard = await apiRequireRole(request, "tickets.submit")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   let body: unknown
   try {
      body = await request.json()
   } catch {
      return invalidBody()
   }

   const parsed = await validate(createTicketSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const ticket = await createTicket(viewer, parsed.value)
      return NextResponse.json({ ticket }, { status: 201 })
   } catch (err) {
      return ticketErrorResponse(err)
   }
}
