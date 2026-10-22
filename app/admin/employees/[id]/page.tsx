import type { Metadata } from "next"
import { notFound } from "next/navigation"
import EmployeeProfileView from "@/app/components/employees/EmployeeProfileView"
import { can } from "@/lib/auth/permissions"
import { requireRole } from "@/lib/auth/auth"
import { getEmployeeDetail } from "@/lib/employees/service"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
   title: fa.employees.metaTitle,
   description: fa.employees.metaDescription,
}

type EmployeePageProps = { params: Promise<{ id: string }> }

export default async function EmployeeProfilePage({ params }: EmployeePageProps) {
   const user = await requireRole("admin.users.read")
   const { id } = await params
   const employee = await getEmployeeDetail(id)
   if (!employee) notFound()

   return (
      <EmployeeProfileView
         employee={employee}
         currentUserId={user.id}
         canWrite={can(user.role, "admin.users.update")}
         canDelete={can(user.role, "admin.users.delete")}
      />
   )
}
