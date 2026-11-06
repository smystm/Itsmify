import type { Metadata } from "next"
import { notFound } from "next/navigation"
import AdminTicketDetailView from "@/app/components/tickets/AdminTicketDetailView"
import { requireRole } from "@/lib/auth/auth"
import {
   TicketServiceError,
   getAdminTicketDetail,
   getAdminTicketOptions,
} from "@/lib/tickets/service"
import type { TicketDetailDto } from "@/lib/tickets/types"
import { fa } from "@/lib/i18n/fa"

export const instant = false

export const metadata: Metadata = {
   title: fa.tickets.detail.metaTitle,
   description: fa.tickets.detail.metaDescription,
}

type TicketPageProps = { params: Promise<{ id: string }> }

export default async function AdminTicketDetailPage({ params }: TicketPageProps) {
   const user = await requireRole("tickets.read.all")
   const { id } = await params

   let ticket: TicketDetailDto
   try {
      ticket = await getAdminTicketDetail(user, id)
   } catch (err) {
      if (err instanceof TicketServiceError && err.status === 404) notFound()
      throw err
   }

   const options = await getAdminTicketOptions(user)

   return (
      <AdminTicketDetailView
         ticket={ticket}
         categories={options.categories}
         assignees={options.assignees}
         viewerId={user.id}
         viewerRole={user.role}
      />
   )
}
