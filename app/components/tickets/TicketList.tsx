import Link from "next/link"
import { TicketPriorityBadge, TicketStatusBadge, TicketTypeBadge } from "./TicketBadges"
import { fa } from "@/lib/i18n/fa"
import { formatJalaliDate } from "@/lib/date/jalali"
import type { TicketActorDto, TicketSummaryDto } from "@/lib/tickets/types"

interface TicketListProps {
   tickets: TicketSummaryDto[]
   basePath: string
   admin?: boolean
}

function actorName(actor: TicketActorDto | null): string {
   if (!actor) return fa.tickets.actions.unassigned
   return `${actor.firstName} ${actor.lastName}`.trim() || actor.username
}

export default function TicketList({ tickets, basePath, admin = false }: TicketListProps) {
   return (
      <>
         <div className="hidden overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-xl shadow-navy-900/5 dark:shadow-black/20 md:block">
            <div className="overflow-x-auto">
               <table className="w-full min-w-[820px] text-right text-sm">
                  <thead className="bg-surface-muted/80 text-[11px] font-bold uppercase tracking-wide text-navy-500 dark:bg-navy-900/60 dark:text-navy-400">
                     <tr>
                        <th className="px-5 py-4">{fa.tickets.list.columns.ticket}</th>
                        {admin ? <th className="px-4 py-4">{fa.tickets.list.columns.requester}</th> : null}
                        {admin ? <th className="px-4 py-4">{fa.tickets.list.columns.assignee}</th> : null}
                        <th className="px-4 py-4">{fa.tickets.list.columns.priority}</th>
                        <th className="px-4 py-4">{fa.tickets.list.columns.status}</th>
                        <th className="px-5 py-4">{fa.tickets.list.columns.createdAt}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                     {tickets.map((ticket) => (
                        <tr key={ticket.id} className="transition-colors hover:bg-surface-muted/50 dark:hover:bg-navy-900/40">
                           <td className="max-w-md px-5 py-4">
                              <Link
                                 href={`${basePath}/${ticket.id}`}
                                 className="text-sm font-extrabold text-navy-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-200"
                              >
                                 {ticket.subject}
                              </Link>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                 <span dir="ltr" className="font-mono text-[11px] font-bold text-brand-700 dark:text-brand-200">
                                    {ticket.ticketNumber}
                                 </span>
                                 <TicketTypeBadge type={ticket.type} />
                                 <span className="text-[11px] text-navy-500 dark:text-navy-400">{ticket.category.name}</span>
                              </div>
                           </td>
                           {admin ? (
                              <td className="px-4 py-4">
                                 <p className="text-xs font-bold text-navy-800 dark:text-navy-100">{actorName(ticket.requester)}</p>
                                 <p dir="ltr" className="mt-0.5 text-[11px] text-navy-500 dark:text-navy-400">
                                    {ticket.requester.username}
                                 </p>
                              </td>
                           ) : null}
                           {admin ? (
                              <td className="px-4 py-4">
                                 <p className={`text-xs font-bold ${ticket.assignee ? "text-navy-800 dark:text-navy-100" : "text-navy-500 dark:text-navy-400"}`}>
                                    {actorName(ticket.assignee)}
                                 </p>
                              </td>
                           ) : null}
                           <td className="px-4 py-4">
                              <TicketPriorityBadge priority={ticket.priority} />
                           </td>
                           <td className="px-4 py-4">
                              <TicketStatusBadge status={ticket.status} />
                           </td>
                           <td className="whitespace-nowrap px-5 py-4 text-xs text-navy-600 dark:text-navy-300">
                              {formatJalaliDate(ticket.createdAt)}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         <div className="space-y-3 md:hidden">
            {tickets.map((ticket) => (
               <article
                  key={ticket.id}
                  className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-lg shadow-navy-900/5 dark:shadow-black/20"
               >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                     <span dir="ltr" className="font-mono text-[11px] font-bold text-brand-700 dark:text-brand-200">
                        {ticket.ticketNumber}
                     </span>
                     <TicketStatusBadge status={ticket.status} />
                  </div>

                  <Link
                     href={`${basePath}/${ticket.id}`}
                     className="mt-2 block text-sm font-extrabold text-navy-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-200"
                  >
                     {ticket.subject}
                  </Link>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                     <TicketTypeBadge type={ticket.type} />
                     <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[10px] font-bold text-navy-600 dark:bg-navy-800 dark:text-navy-300">
                        {ticket.category.name}
                     </span>
                     <TicketPriorityBadge priority={ticket.priority} />
                  </div>

                  {admin ? (
                     <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                           <dt className="text-navy-500 dark:text-navy-400">{fa.tickets.list.columns.requester}</dt>
                           <dd className="mt-0.5 font-bold text-navy-800 dark:text-navy-100">{actorName(ticket.requester)}</dd>
                        </div>
                        <div>
                           <dt className="text-navy-500 dark:text-navy-400">{fa.tickets.list.columns.assignee}</dt>
                           <dd className="mt-0.5 font-bold text-navy-800 dark:text-navy-100">{actorName(ticket.assignee)}</dd>
                        </div>
                     </dl>
                  ) : null}

                  <p className="mt-3 text-[11px] text-navy-500 dark:text-navy-400">
                     {fa.tickets.list.columns.createdAt}: {formatJalaliDate(ticket.createdAt)}
                  </p>
               </article>
            ))}
         </div>
      </>
   )
}
