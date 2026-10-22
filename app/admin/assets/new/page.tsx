import type { Metadata } from "next"
import AssetForm from "@/app/components/assets/AssetForm"
import { requireRole } from "@/lib/auth/auth"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
   title: fa.assets.form.createTitle,
   description: fa.assets.form.createDescription,
}

export default async function NewAssetPage() {
   await requireRole("equipment.write")
   return <AssetForm mode="create" />
}
