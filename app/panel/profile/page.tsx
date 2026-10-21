import type { Metadata } from "next"
import { redirect } from "next/navigation"
import ProfileClient from "@/app/components/panel/ProfileClient"
import { requireUser } from "@/lib/auth/auth"
import { getOwnProfile } from "@/lib/profile/profile"
import { fa } from "@/lib/i18n/fa"

export const metadata: Metadata = {
    title: fa.profile.metaTitle,
    description: fa.profile.metaDescription,
}

/**
 * The self-service account surface. Identity fields are read-only by design;
 * the only write paths are the phone OTP flow and the password screen, both
 * re-validated server-side.
 */
export default async function PanelProfilePage() {
    const sessionUser = await requireUser("/login")

    const profile = await getOwnProfile(sessionUser.id)
    if (!profile) redirect("/login")

    return <ProfileClient profile={profile} />
}
