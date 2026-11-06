import type { Metadata } from "next"
import { notFound } from "next/navigation"
import TicketDetailView from "@/app/components/tickets/TicketDetailView"
import { requireRole } from "@/lib/auth/auth"
import { TicketServiceError, getMyTicketDetail } from "@/lib/tickets/service"
import type { TicketDetailDto } from "@/lib/tickets/types"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
   title: fa.tickets.detail.metaTitle,
   description: fa.tickets.detail.metaDescription,
}

type TicketPageProps = { params: Promise<{ id: string }> }

export default async function PanelTicketDetailPage({ params }: TicketPageProps) {
   const user = await requireRole("tickets.read.own")
   const { id } = await params

   let ticket: TicketDetailDto
   try {
      ticket = await getMyTicketDetail(user, id)
   } catch (err) {
      if (err instanceof TicketServiceError && err.status === 404) notFound()
      throw err
   }

   return <TicketDetailView ticket={ticket} viewerId={user.id} />
}
