import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser, invalidBody } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { createTicketCategorySchema } from "@/lib/tickets/validation"
import {
   createTicketCategory,
   listTicketCategories,
   ticketErrorResponse,
} from "@/lib/tickets/service"

/** GET /api/admin/ticket-categories — every category, including inactive ones. */
export async function GET(request: NextRequest) {
   const guard = await apiRequireRole(request, "tickets.categories.manage")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   try {
      return NextResponse.json({ categories: await listTicketCategories(viewer) })
   } catch (err) {
      return ticketErrorResponse(err)
   }
}

/** POST /api/admin/ticket-categories — create a category. Deletion is not supported. */
export async function POST(request: NextRequest) {
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

   const parsed = await validate(createTicketCategorySchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const category = await createTicketCategory(viewer, parsed.value)
      return NextResponse.json({ category }, { status: 201 })
   } catch (err) {
      return ticketErrorResponse(err)
   }
}
