import type { Metadata } from "next"
import UsersPanel from "@/app/components/admin/UsersPanel"
import { requireRole } from "@/lib/auth/auth"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
    title: fa.admin.usersPageTitle,
    description: fa.admin.usersPageDescription,
}

export default async function AdminUsersPage() {
    const user = await requireRole("admin.users.read")
    return <UsersPanel currentUserId={user.id} />
}
