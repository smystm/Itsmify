import type { Metadata } from "next"
import { notFound } from "next/navigation"
import AssetForm from "@/app/components/assets/AssetForm"
import { requireRole } from "@/lib/auth/auth"
import { getAssetDetail } from "@/lib/assets/service"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
   title: fa.assets.form.editTitle,
   description: fa.assets.form.editDescription,
}

type EditAssetPageProps = { params: Promise<{ id: string }> }

export default async function EditAssetPage({ params }: EditAssetPageProps) {
   await requireRole("equipment.write")
   const { id } = await params
   const asset = await getAssetDetail(id)
   if (!asset) notFound()

   return <AssetForm mode="edit" asset={asset} />
}
