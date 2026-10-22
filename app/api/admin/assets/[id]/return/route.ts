import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser, invalidBody } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { returnAssetSchema } from "@/lib/assets/validation"
import { assetErrorResponse, returnAsset } from "@/lib/assets/service"

type ReturnRouteContext = { params: Promise<{ id: string }> }

/** POST /api/admin/assets/[id]/return — close the open assignment. */
export async function POST(request: NextRequest, ctx: ReturnRouteContext) {
   const guard = await apiRequireRole(request, "equipment.write")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   let body: unknown
   try {
      body = await request.json()
   } catch {
      body = {}
   }

   const parsed = await validate(returnAssetSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const { id } = await ctx.params
      const asset = await returnAsset(id, parsed.value.note || null, viewer)
      return NextResponse.json({ asset })
   } catch (err) {
      return assetErrorResponse(err)
   }
}
