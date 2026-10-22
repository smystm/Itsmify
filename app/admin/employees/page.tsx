import type { Metadata } from "next"
import EmployeesPanel from "@/app/components/employees/EmployeesPanel"
import { requireRole } from "@/lib/auth/auth"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
   title: fa.employees.metaTitle,
   description: fa.employees.metaDescription,
}

export default async function AdminEmployeesPage() {
   const user = await requireRole("admin.users.read")
   return <EmployeesPanel currentUserId={user.id} />
}
