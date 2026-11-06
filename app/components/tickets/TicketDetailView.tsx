"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRightIcon, PencilSquareIcon, TicketIcon } from "@heroicons/react/24/outline"
import PageHero from "@/app/components/ui/PageHero"
import StatStrip from "@/app/components/ui/StatStrip"
import FormSection from "@/app/components/ui/FormSection"
import AdminNotice from "@/app/components/ui/AdminNotice"
import { TicketPriorityBadge, TicketStatusBadge, TicketTypeBadge, ticketStatusLabel } from "./TicketBadges"
import TicketComments from "./TicketComments"
import TicketEditDialog from "./TicketEditDialog"
import TicketHistory from "./TicketHistory"
import TicketInfoRow from "./TicketInfoRow"
import TicketStatusDialog from "./TicketStatusDialog"
import { fa } from "@/lib/i18n/fa"
import { formatJalaliDate, formatJalaliDateTime } from "@/lib/date/jalali"
import type { TicketDetailDto } from "@/lib/tickets/types"
import type { TicketStatusValue } from "@/lib/tickets/validation"
import {
   allowedEmployeeStatusTargets,
   canAddEmployeeComment,
   canEditEmployeeContent,
} from "@/lib/tickets/workflow"

interface TicketDetailViewProps {
   ticket: TicketDetailDto
   viewerId: string
}

function actionLabel(target: TicketStatusValue): string {
   switch (target) {
      case "CANCELLED":
         return fa.tickets.actions.cancel
      case "CLOSED":
         return fa.tickets.actions.close
      case "IN_PROGRESS":
         return fa.tickets.actions.reopen
      case "RESOLVED":
         return fa.tickets.actions.resolve
      default:
         return ticketStatusLabel(target)
   }
}

function actionClass(target: TicketStatusValue): string {
   if (target === "CANCELLED") {
      return "border-red-300 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200"
   }
   if (target === "CLOSED") {
      return "border-border-subtle bg-surface text-navy-700 hover:border-brand-400 hover:text-brand-800 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200"
   }
   return "border-brand-500/40 bg-brand-500/10 text-brand-700 hover:bg-brand-500/15 dark:text-brand-200"
}

export default function TicketDetailView({ ticket, viewerId }: TicketDetailViewProps) {
   const router = useRouter()
   const [notice, setNotice] = useState<string | null>(null)
   const [editOpen, setEditOpen] = useState(false)
   const [statusTarget, setStatusTarget] = useState<TicketStatusValue | null>(null)

   const state = {
      requesterId: ticket.requester.id,
      assigneeId: ticket.assignee?.id ?? null,
      status: ticket.status,
   }
   const canEdit = canEditEmployeeContent(viewerId, state)
   const canComment = canAddEmployeeComment(viewerId, state)
   const statusTargets = allowedEmployeeStatusTargets(viewerId, state)

   // The API already hides internal entries from employees; this filter is a second line of defense.
   const publicComments = ticket.comments.filter((comment) => comment.visibility === "PUBLIC")
   const publicHistory = ticket.history.filter((event) => event.visibility === "PUBLIC")
   const assigneeName = ticket.assignee
      ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}`.trim() || ticket.assignee.username
      : fa.tickets.actions.unassigned

   return (
      <div className="space-y-6">
         <PageHero
            badge={ticket.ticketNumber}
            title={ticket.subject}
            description={`${fa.tickets.types[ticket.type] ?? ticket.type} · ${ticket.category.name}`}
            actions={
               <div className="flex flex-wrap gap-2">
                  <Link
                     href="/panel/tickets"
                     className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-2.5 text-sm font-bold text-navy-700 transition-colors hover:border-brand-400 hover:text-brand-800 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200"
                  >
                     <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                     {fa.tickets.detail.backToList}
                  </Link>
                  {canEdit ? (
                     <button
                        type="button"
                        onClick={() => setEditOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all hover:brightness-110"
                     >
                        <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                        {fa.tickets.detail.editAction}
                     </button>
                  ) : null}
               </div>
            }
         />

         {notice ? <AdminNotice tone="success">{notice}</AdminNotice> : null}

         <StatStrip
            columns={4}
            items={[
               {
                  value: ticketStatusLabel(ticket.status),
                  label: fa.tickets.detail.info.status,
                  icon: <TicketIcon className="h-5 w-5" />,
               },
               {
                  value: fa.tickets.priorities[ticket.priority] ?? ticket.priority,
                  label: fa.tickets.detail.info.priority,
               },
               {
                  value: ticket.category.name,
                  label: fa.tickets.detail.info.category,
               },
               {
                  value: formatJalaliDate(ticket.createdAt),
                  label: fa.tickets.detail.info.createdAt,
               },
            ]}
         />

         <div className="flex flex-wrap items-center gap-2">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            <TicketTypeBadge type={ticket.type} />
         </div>

         <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
               <FormSection title={fa.tickets.detail.detailsTitle} hint={fa.tickets.detail.detailsDescription}>
                  <p className="whitespace-pre-wrap text-sm leading-8 text-navy-700 dark:text-navy-200">{ticket.description}</p>

                  <dl className="mt-6 grid gap-x-6 gap-y-5 border-t border-border-subtle pt-5 sm:grid-cols-2 lg:grid-cols-3">
                     <TicketInfoRow label={fa.tickets.detail.info.number} value={<span dir="ltr">{ticket.ticketNumber}</span>} />
                     <TicketInfoRow label={fa.tickets.detail.info.assignee} value={assigneeName} />
                     <TicketInfoRow label={fa.tickets.detail.info.updatedAt} value={formatJalaliDateTime(ticket.lastActivityAt)} />
                     {ticket.resolvedAt ? (
                        <TicketInfoRow label={fa.tickets.detail.info.resolvedAt} value={formatJalaliDateTime(ticket.resolvedAt)} />
                     ) : null}
                     {ticket.closedAt ? (
                        <TicketInfoRow label={fa.tickets.detail.info.closedAt} value={formatJalaliDateTime(ticket.closedAt)} />
                     ) : null}
                     {ticket.cancelledAt ? (
                        <TicketInfoRow label={fa.tickets.detail.info.cancelledAt} value={formatJalaliDateTime(ticket.cancelledAt)} />
                     ) : null}
                  </dl>
               </FormSection>

               {ticket.resolutionNote ? (
                  <FormSection title={fa.tickets.detail.resolutionNote}>
                     <p className="whitespace-pre-wrap rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm leading-8 text-emerald-900 dark:text-emerald-100">
                        {ticket.resolutionNote}
                     </p>
                  </FormSection>
               ) : null}

               <FormSection title={fa.tickets.detail.commentsTitle} hint={fa.tickets.detail.commentsDescription}>
                  <TicketComments
                     ticketId={ticket.id}
                     comments={publicComments}
                     mode="employee"
                     canComment={canComment}
                  />
               </FormSection>

               <FormSection title={fa.tickets.detail.historyTitle} hint={fa.tickets.detail.historyDescription}>
                  <TicketHistory history={publicHistory} truncated={ticket.historyTruncated} />
               </FormSection>
            </div>

            <aside className="space-y-6">
               <FormSection title={fa.tickets.detail.statusCardTitle} hint={fa.tickets.detail.statusCardDescription}>
                  <div className="space-y-4">
                     <div className="flex flex-wrap items-center gap-2">
                        <TicketStatusBadge status={ticket.status} />
                        <TicketPriorityBadge priority={ticket.priority} />
                     </div>

                     {statusTargets.length > 0 ? (
                        <div className="space-y-2">
                           {statusTargets.map((target) => (
                              <button
                                 key={target}
                                 type="button"
                                 onClick={() => setStatusTarget(target)}
                                 className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${actionClass(target)}`}
                              >
                                 {actionLabel(target)}
                              </button>
                           ))}
                        </div>
                     ) : (
                        <p className="text-xs leading-6 text-navy-500 dark:text-navy-400">
                           {ticket.status === "CLOSED" || ticket.status === "CANCELLED"
                              ? fa.tickets.detail.terminalNote
                              : fa.tickets.detail.noActions}
                        </p>
                     )}
                  </div>
               </FormSection>

               <FormSection title={fa.tickets.detail.info.assignee}>
                  <p className="text-sm font-extrabold text-navy-900 dark:text-white">{assigneeName}</p>
                  {ticket.assignee ? (
                     <p dir="ltr" className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                        {ticket.assignee.username}
                     </p>
                  ) : null}
               </FormSection>
            </aside>
         </div>

         {editOpen ? (
            <TicketEditDialog
               ticket={ticket}
               mode="employee"
               canEditContent={canEdit}
               onClose={() => setEditOpen(false)}
               onDone={(message) => {
                  setNotice(message)
                  router.refresh()
               }}
            />
         ) : null}

         {statusTarget ? (
            <TicketStatusDialog
               ticketId={ticket.id}
               target={statusTarget}
               mode="employee"
               onClose={() => setStatusTarget(null)}
               onDone={(message) => {
                  setNotice(message)
                  router.refresh()
               }}
            />
         ) : null}
      </div>
   )
}
