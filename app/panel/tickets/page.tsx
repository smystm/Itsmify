import type { Metadata } from "next"
import PanelTicketsView from "@/app/components/tickets/PanelTicketsView"
import { requireRole } from "@/lib/auth/auth"
import { getMyTicketOptions } from "@/lib/tickets/service"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
   title: fa.tickets.list.metaTitle,
   description: fa.tickets.list.metaDescription,
}

export default async function PanelTicketsPage() {
   const user = await requireRole("tickets.read.own")
   const options = await getMyTicketOptions(user)

   return <PanelTicketsView categories={options.categories} />
}
