import type { Metadata } from "next"
import AdminOverview from "@/app/components/admin/AdminOverview"
import { fa } from "@/lib/i18n/fa"

/**
 * Reaches /admin only through the per-request role gate (layout) — navigations
 * legitimately block there, so instant validation is off for this segment.
 */
export const instant = false

export const metadata: Metadata = {
    title: fa.admin.metaTitle,
    description: fa.admin.metaDescription,
}

/** The SYS_ADMIN dashboard: snapshot overview, quick actions and recent work. */
export default function AdminPage() {
    return <AdminOverview />
}
