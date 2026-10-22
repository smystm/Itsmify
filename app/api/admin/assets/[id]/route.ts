import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser, invalidBody, toErrorResponse } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { updateAssetSchema } from "@/lib/assets/validation"
import { assetErrorResponse, deleteAsset, getAssetDetail, updateAsset } from "@/lib/assets/service"

type AssetRouteContext = { params: Promise<{ id: string }> }

/** GET /api/admin/assets/[id] — full asset, technical details and history. */
export async function GET(request: NextRequest, ctx: AssetRouteContext) {
   const guard = await apiRequireRole(request, "equipment.read")
   if (guard) return guard

   try {
      const { id } = await ctx.params
      const asset = await getAssetDetail(id)
      if (!asset) return NextResponse.json({ error: "not_found" }, { status: 404 })
      return NextResponse.json({ asset })
   } catch (err) {
      return toErrorResponse(err)
   }
}

/** PATCH /api/admin/assets/[id] — edit base fields and replace detail data. */
export async function PATCH(request: NextRequest, ctx: AssetRouteContext) {
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

   const parsed = await validate(updateAssetSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const { id } = await ctx.params
      const asset = await updateAsset(id, parsed.value, viewer)
      return NextResponse.json({ asset })
   } catch (err) {
      return assetErrorResponse(err)
   }
}

/** DELETE /api/admin/assets/[id] — soft delete; blocked while assigned. */
export async function DELETE(request: NextRequest, ctx: AssetRouteContext) {
   const guard = await apiRequireRole(request, "equipment.delete")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

   try {
      const { id } = await ctx.params
      await deleteAsset(id, viewer)
      return NextResponse.json({ ok: true })
   } catch (err) {
      return assetErrorResponse(err)
   }
}
