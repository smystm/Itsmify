import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { apiRequireRole, invalidBody } from "@/lib/auth/https"
import { validate } from "@/lib/auth/validation"
import { updateContractOptionSchema } from "@/lib/contracts/validation"
import { contractErrorResponse, deleteContractOption, updateContractOption } from "@/lib/contracts/service"

type ContractOptionRouteContext = { params: Promise<{ id: string }> }

/** Rename a contract value. Existing assets follow the new name. SYS_ADMIN only. */
export async function PATCH(request: NextRequest, ctx: ContractOptionRouteContext) {
   const guard = await apiRequireRole(request, "equipment.options.manage")
   if (guard) return guard

   let body: unknown
   try {
      body = await request.json()
   } catch {
      return invalidBody()
   }

   const parsed = await validate(updateContractOptionSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   try {
      const { id } = await ctx.params
      const option = await updateContractOption(id, parsed.value)
      return NextResponse.json({ option })
   } catch (err) {
      return contractErrorResponse(err)
   }
}

/** Delete a contract value that no active asset uses. SYS_ADMIN only. */
export async function DELETE(request: NextRequest, ctx: ContractOptionRouteContext) {
   const guard = await apiRequireRole(request, "equipment.options.manage")
   if (guard) return guard

   try {
      const { id } = await ctx.params
      await deleteContractOption(id)
      return NextResponse.json({ ok: true })
   } catch (err) {
      return contractErrorResponse(err)
   }
}
