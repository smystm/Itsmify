import { redirect } from "next/navigation"

/** The old account URL is kept as a permanent redirect to the employee area. */
export default function LegacyAdminUsersPage() {
   redirect("/admin/employees")
}
