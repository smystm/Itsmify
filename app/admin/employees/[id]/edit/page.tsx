import type { Metadata } from "next"
import { notFound } from "next/navigation"
import EmployeeForm from "@/app/components/employees/EmployeeForm"
import { requireRole } from "@/lib/auth/auth"
import { getEmployeeDetail } from "@/lib/employees/service"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
   title: fa.employees.form.editTitle,
   description: fa.employees.form.editDescription,
}

type EditEmployeePageProps = { params: Promise<{ id: string }> }

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
   const user = await requireRole("admin.users.update")
   const { id } = await params
   const employee = await getEmployeeDetail(id)
   if (!employee || employee.deletedAt) notFound()

   return <EmployeeForm mode="edit" employee={employee} isSelf={employee.id === user.id} />
}
