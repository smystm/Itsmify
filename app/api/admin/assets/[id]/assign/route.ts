import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser, invalidBody } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { assignAssetSchema } from "@/lib/assets/validation"
import { assetErrorResponse, assignAsset } from "@/lib/assets/service"

type AssignRouteContext = { params: Promise<{ id: string }> }

/** POST /api/admin/assets/[id]/assign — atomically replace the open assignee. */
export async function POST(request: NextRequest, ctx: AssignRouteContext) {
   const guard = await apiRequireRole(request, "equipment.write")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   let body: unknown
   try {
      body = await request.json()
   } catch {
      return invalidBody()
   }

   const parsed = await validate(assignAssetSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const { id } = await ctx.params
      const asset = await assignAsset(id, parsed.value.employeeId, parsed.value.note || null, viewer)
      return NextResponse.json({ asset })
   } catch (err) {
      return assetErrorResponse(err)
   }
}
