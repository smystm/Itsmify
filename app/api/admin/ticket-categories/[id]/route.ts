import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser, invalidBody } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { updateTicketCategorySchema } from "@/lib/tickets/validation"
import { ticketErrorResponse, updateTicketCategory } from "@/lib/tickets/service"

type TicketCategoryRouteContext = { params: Promise<{ id: string }> }

/** PATCH /api/admin/ticket-categories/[id] — rename, reorder or activate/deactivate. */
export async function PATCH(request: NextRequest, ctx: TicketCategoryRouteContext) {
   const guard = await apiRequireRole(request, "tickets.categories.manage")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   let body: unknown
   try {
      body = await request.json()
   } catch {
      return invalidBody()
   }

   const parsed = await validate(updateTicketCategorySchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const { id } = await ctx.params
      const category = await updateTicketCategory(viewer, id, parsed.value)
      return NextResponse.json({ category })
   } catch (err) {
      return ticketErrorResponse(err)
   }
}
