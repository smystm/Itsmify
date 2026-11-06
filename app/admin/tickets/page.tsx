import type { Metadata } from "next"
import AdminTicketsView from "@/app/components/tickets/AdminTicketsView"
import { requireRole } from "@/lib/auth/auth"
import { getAdminTicketOptions } from "@/lib/tickets/service"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
   title: fa.tickets.adminList.metaTitle,
   description: fa.tickets.adminList.metaDescription,
}

export default async function AdminTicketsPage() {
   const user = await requireRole("tickets.read.all")
   const options = await getAdminTicketOptions(user)

   return <AdminTicketsView categories={options.categories} assignees={options.assignees} />
}
