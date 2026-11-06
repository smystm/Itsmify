import StatusBadge, { type StatusTone } from "@/app/components/ui/StatusBadge"
import { fa } from "@/lib/i18n/fa"
import type {
   TicketPriorityValue,
   TicketStatusValue,
   TicketTypeValue,
   TicketVisibilityValue,
} from "@/lib/tickets/validation"

export function ticketStatusTone(status: TicketStatusValue): StatusTone {
   switch (status) {
      case "IN_PROGRESS":
         return "pending"
      case "RESOLVED":
         return "approved"
      case "CANCELLED":
         return "rejected"
      case "NEW":
         return "info"
      default:
         return "neutral"
   }
}

export function ticketPriorityTone(priority: TicketPriorityValue): StatusTone {
   switch (priority) {
      case "CRITICAL":
         return "rejected"
      case "HIGH":
         return "pending"
      case "MEDIUM":
         return "info"
      default:
         return "neutral"
   }
}

export function ticketStatusLabel(status: TicketStatusValue): string {
   return fa.tickets.statuses[status] ?? status
}

export function ticketPriorityLabel(priority: TicketPriorityValue): string {
   return fa.tickets.priorities[priority] ?? priority
}

export function ticketTypeLabel(type: TicketTypeValue): string {
   return fa.tickets.types[type] ?? type
}

export function TicketStatusBadge({ status, className = "" }: { status: TicketStatusValue; className?: string }) {
   return <StatusBadge tone={ticketStatusTone(status)} label={ticketStatusLabel(status)} className={className} />
}

export function TicketPriorityBadge({
   priority,
   className = "",
}: {
   priority: TicketPriorityValue
   className?: string
}) {
   return <StatusBadge tone={ticketPriorityTone(priority)} label={ticketPriorityLabel(priority)} className={className} />
}

export function TicketTypeBadge({ type }: { type: TicketTypeValue }) {
   return (
      <span className="inline-flex items-center rounded-full bg-accent-500/12 px-3 py-1 text-xs font-bold text-accent-800 ring-1 ring-accent-500/25 dark:text-accent-200 dark:ring-accent-400/30">
         {ticketTypeLabel(type)}
      </span>
   )
}

export function TicketVisibilityBadge({ visibility }: { visibility: TicketVisibilityValue }) {
   return (
      <span
         className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${
            visibility === "INTERNAL"
               ? "bg-amber-500/15 text-amber-800 ring-amber-500/30 dark:text-amber-200 dark:ring-amber-400/30"
               : "bg-surface-muted text-navy-600 ring-border-subtle dark:bg-navy-800 dark:text-navy-300 dark:ring-navy-700"
         }`}
      >
         {fa.tickets.visibilities[visibility] ?? visibility}
      </span>
   )
}
