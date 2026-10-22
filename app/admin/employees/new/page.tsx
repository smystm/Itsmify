import type { Metadata } from "next"
import EmployeeForm from "@/app/components/employees/EmployeeForm"
import { requireRole } from "@/lib/auth/auth"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
   title: fa.employees.form.createTitle,
   description: fa.employees.form.createDescription,
}

export default async function NewEmployeePage() {
   await requireRole("admin.users.create")
   return <EmployeeForm mode="create" />
}
