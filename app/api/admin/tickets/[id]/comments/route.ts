import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser, invalidBody } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { adminCommentSchema } from "@/lib/tickets/validation"
import { addAdminTicketComment, ticketErrorResponse } from "@/lib/tickets/service"

type TicketRouteContext = { params: Promise<{ id: string }> }

/** POST /api/admin/tickets/[id]/comments — public reply or internal IT note. */
export async function POST(request: NextRequest, ctx: TicketRouteContext) {
   const guard = await apiRequireRole(request, "tickets.read.all")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   let body: unknown
   try {
      body = await request.json()
   } catch {
      return invalidBody()
   }

   const parsed = await validate(adminCommentSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const { id } = await ctx.params
      const comment = await addAdminTicketComment(viewer, id, parsed.value)
      return NextResponse.json({ comment }, { status: 201 })
   } catch (err) {
      return ticketErrorResponse(err)
   }
}
