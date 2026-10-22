import type { Metadata } from "next"
import { notFound } from "next/navigation"
import AssetDetailView from "@/app/components/assets/AssetDetailView"
import { can } from "@/lib/auth/permissions"
import { requireRole } from "@/lib/auth/auth"
import { getAssetDetail } from "@/lib/assets/service"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
   title: fa.assets.metaTitle,
   description: fa.assets.metaDescription,
}

type AssetPageProps = { params: Promise<{ id: string }> }

export default async function AssetDetailPage({ params }: AssetPageProps) {
   const user = await requireRole("equipment.read")
   const { id } = await params
   const asset = await getAssetDetail(id)
   if (!asset) notFound()

   return (
      <AssetDetailView
         asset={asset}
         canWrite={can(user.role, "equipment.write")}
         canDelete={can(user.role, "equipment.delete")}
      />
   )
}
