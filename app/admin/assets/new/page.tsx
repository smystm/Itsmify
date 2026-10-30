import type { Metadata } from "next"
import AssetForm from "@/app/components/assets/AssetForm"
import { requireRole } from "@/lib/auth/auth"
import { listContractOptions } from "@/lib/contracts/service"
import { groupContractOptions } from "@/lib/contracts/types"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
   title: fa.assets.form.createTitle,
   description: fa.assets.form.createDescription,
}

export default async function NewAssetPage() {
   await requireRole("equipment.write")
   const options = groupContractOptions(await listContractOptions())
   return <AssetForm mode="create" options={options} />
}
