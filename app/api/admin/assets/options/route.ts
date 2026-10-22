import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, toErrorResponse } from "@/lib/auth/https"
import { listAssetOptions } from "@/lib/assets/service"

/** Parent-asset picker. */
export async function GET(request: NextRequest) {
   const guard = await apiRequireRole(request, "equipment.read")
   if (guard) return guard

   try {
      const params = request.nextUrl.searchParams
      const assets = await listAssetOptions(
         params.get("q") ?? "",
         params.get("excludeId") ?? undefined,
         30,
      )
      return NextResponse.json({ assets })
   } catch (err) {
      return toErrorResponse(err)
   }
}
