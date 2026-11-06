import { TicketVisibilityBadge } from "./TicketBadges"
import { fa } from "@/lib/i18n/fa"
import { formatJalaliDateTime } from "@/lib/date/jalali"
import type { TicketHistoryDto } from "@/lib/tickets/types"

interface TicketHistoryProps {
   history: TicketHistoryDto[]
   truncated?: boolean
}

function translatedValue(field: string | null, value: string | null): string | null {
   if (!value) return null
   switch (field) {
      case "status":
         return fa.tickets.statuses[value] ?? value
      case "priority":
         return fa.tickets.priorities[value] ?? value
      case "type":
         return fa.tickets.types[value] ?? value
      case "visibility":
         return fa.tickets.visibilities[value] ?? value
      default:
         return value
   }
}

export default function TicketHistory({ history, truncated = false }: TicketHistoryProps) {
   if (history.length === 0) {
      return (
         <p className="rounded-2xl bg-surface-muted/60 px-4 py-3 text-xs text-navy-500 dark:bg-navy-900/50 dark:text-navy-400">
            {fa.tickets.history.empty}
         </p>
      )
   }

   return (
      <div className="space-y-4">
         <ol className="relative space-y-5 border-s border-border-subtle ps-5 dark:border-navy-700">
            {history.map((event) => {
               const actor = event.actor
                  ? `${event.actor.firstName} ${event.actor.lastName}`.trim() || event.actor.username
                  : fa.tickets.history.system
               const fieldLabel = event.field ? fa.tickets.history.fields[event.field] ?? event.field : null
               const from = translatedValue(event.field, event.fromValue)
               const to = translatedValue(event.field, event.toValue)
               const change = from && to ? fa.tickets.history.change.replace("{from}", from).replace("{to}", to) : to

               return (
                  <li key={event.id} className="relative">
                     <span
                        aria-hidden="true"
                        className="absolute -start-[1.55rem] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-surface dark:ring-navy-900"
                     />
                     <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                           <span className="text-xs font-extrabold text-navy-900 dark:text-white">
                              {fa.tickets.history.actions[event.action] ?? event.action}
                           </span>
                           {fieldLabel ? (
                              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-navy-600 dark:bg-navy-800 dark:text-navy-300">
                                 {fieldLabel}
                              </span>
                           ) : null}
                           {event.visibility === "INTERNAL" ? (
                              <TicketVisibilityBadge visibility="INTERNAL" />
                           ) : null}
                        </div>
                        <span className="text-[10px] text-navy-500 dark:text-navy-400">
                           {formatJalaliDateTime(event.createdAt)}
                        </span>
                     </div>

                     {change ? (
                        <p className="mt-1 text-xs leading-6 text-navy-600 dark:text-navy-300">{change}</p>
                     ) : null}
                     {event.note ? (
                        <p className="mt-1.5 rounded-xl bg-surface-muted/60 px-3 py-2 text-xs leading-6 text-navy-600 dark:bg-navy-900/50 dark:text-navy-300">
                           {event.note}
                        </p>
                     ) : null}
                     <p className="mt-1 text-[10px] text-navy-400 dark:text-navy-500">
                        {event.actor ? fa.tickets.history.by.replace("{name}", actor) : fa.tickets.history.system}
                     </p>
                  </li>
               )
            })}
         </ol>

         {truncated ? (
            <p className="text-[11px] text-navy-500 dark:text-navy-400">{fa.tickets.detail.truncated}</p>
         ) : null}
      </div>
   )
}
