import type { Metadata } from "next"
import AssetsPanel from "@/app/components/assets/AssetsPanel"
import { can } from "@/lib/auth/permissions"
import { requireRole } from "@/lib/auth/auth"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
   title: fa.assets.metaTitle,
   description: fa.assets.metaDescription,
}

export default async function AdminAssetsPage() {
   const user = await requireRole("equipment.read")
   return <AssetsPanel canWrite={can(user.role, "equipment.write")} canDelete={can(user.role, "equipment.delete")} />
}
