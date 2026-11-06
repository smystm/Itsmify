import type { Metadata } from "next"
import TicketCreateForm from "@/app/components/tickets/TicketCreateForm"
import { requireRole } from "@/lib/auth/auth"
import { getMyTicketOptions } from "@/lib/tickets/service"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
   title: fa.tickets.create.metaTitle,
   description: fa.tickets.create.metaDescription,
}

export default async function NewTicketPage() {
   const user = await requireRole("tickets.submit")
   const options = await getMyTicketOptions(user)

   return <TicketCreateForm categories={options.categories} />
}
