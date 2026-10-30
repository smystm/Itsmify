import type { Metadata } from "next"
import { redirect } from "next/navigation"
import AssignedAssetsList from "@/app/components/panel/AssignedAssetsList"
import PageHero from "@/app/components/ui/PageHero"
import { requireRole } from "@/lib/auth/auth"
import { can } from "@/lib/auth/permissions"
import { getOwnProfile } from "@/lib/profile/profile"
import { fa } from "@/lib/i18n/fa"

export const metadata: Metadata = {
   title: fa.panel.myAssetsMetaTitle,
   description: fa.panel.myAssetsMetaDescription,
}

/**
 * Self-service asset view. Ownership comes from the session id inside
 * getOwnProfile; there is no client-supplied employee id to tamper with.
 */
export default async function PanelAssetsPage() {
   const user = await requireRole("equipment.read.own")
   const profile = await getOwnProfile(user.id)
   if (!profile) redirect("/login")

   return (
      <div className="space-y-8">
         <PageHero
            badge={fa.panel.badge}
            title={fa.panel.sectionEquipment}
            description={fa.panel.myAssetsDescription}
            tone="brand"
         />

         <section aria-label={fa.panel.sectionEquipment}>
            <AssignedAssetsList
               assignments={profile.assignedAssets}
               canOpenAdminDetail={can(user.role, "equipment.read")}
            />
         </section>
      </div>
   )
}
