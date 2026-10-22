import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, apiSessionUser, invalidBody, toErrorResponse } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { createAssetSchema } from "@/lib/assets/validation"
import { assetErrorResponse, createAsset, listAssets } from "@/lib/assets/service"

/** GET /api/admin/assets — filtered, paginated inventory. */
export async function GET(request: NextRequest) {
   const guard = await apiRequireRole(request, "equipment.read")
   if (guard) return guard

   try {
      const params = request.nextUrl.searchParams
      const assignedParam = params.get("assigned")
      const result = await listAssets({
         q: params.get("q") ?? undefined,
         category: params.get("category") ?? undefined,
         type: params.get("type") ?? undefined,
         status: params.get("status") ?? undefined,
         assigned: assignedParam === "assigned" || assignedParam === "unassigned" ? assignedParam : undefined,
         employeeId: params.get("employeeId") ?? undefined,
         page: Number(params.get("page") ?? "1"),
         pageSize: Number(params.get("pageSize") ?? "20"),
         sort: params.get("sort") ?? undefined,
      })
      return NextResponse.json(result)
   } catch (err) {
      return toErrorResponse(err)
   }
}

/** POST /api/admin/assets — register an asset and optional category details. */
export async function POST(request: NextRequest) {
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

   const parsed = await validate(createAssetSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const result = await createAsset(parsed.value, viewer)
      return NextResponse.json(result, { status: 201 })
   } catch (err) {
      return assetErrorResponse(err)
   }
}
