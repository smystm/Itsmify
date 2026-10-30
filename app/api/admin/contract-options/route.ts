import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireAnyAction, apiRequireRole, invalidBody } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { createContractOptionSchema } from "@/lib/contracts/validation"
import { contractErrorResponse, createContractOption, listContractOptions } from "@/lib/contracts/service"

/** Contract-managed choices shared by the asset form and the Contract Builder. */
export async function GET(request: NextRequest) {
   const guard = await apiRequireAnyAction(request, "equipment.read", "equipment.options.manage")
   if (guard) return guard

   try {
      return NextResponse.json({ options: await listContractOptions() })
   } catch (err) {
      return contractErrorResponse(err)
   }
}

/** Create a contract value. SYS_ADMIN only. */
export async function POST(request: NextRequest) {
   const guard = await apiRequireRole(request, "equipment.options.manage")
   if (guard) return guard

   let body: unknown
   try {
      body = await request.json()
   } catch {
      return invalidBody()
   }

   const parsed = await validate(createContractOptionSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const option = await createContractOption(parsed.value)
      return NextResponse.json({ option }, { status: 201 })
   } catch (err) {
      return contractErrorResponse(err)
   }
}
