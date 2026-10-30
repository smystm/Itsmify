import type { Metadata } from "next"
import ContractBuilderPanel from "@/app/components/contract-builder/ContractBuilderPanel"
import { requireRole } from "@/lib/auth/auth"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
   title: fa.contractBuilder.metaTitle,
   description: fa.contractBuilder.metaDescription,
}

export default async function ContractBuilderPage() {
   await requireRole("equipment.options.manage")
   return <ContractBuilderPanel />
}
