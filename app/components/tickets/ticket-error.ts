import { ApiError } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"

/** Map Phase 2 ticket error codes to user-facing Persian copy. */
export function ticketErrorMessage(err: unknown, fallback: string = fa.tickets.errors.generic): string {
   if (!(err instanceof ApiError)) return fallback

   switch (err.code) {
      case "terminal_ticket":
         return fa.tickets.errors.terminalTicket
      case "ticket_immutable":
         return fa.tickets.errors.ticketImmutable
      case "already_assigned":
         return fa.tickets.errors.alreadyAssigned
      case "assignee_not_eligible":
         return fa.tickets.errors.assigneeNotEligible
      case "category_inactive":
         return fa.tickets.errors.categoryInactive
      case "invalid_transition":
         return fa.tickets.errors.invalidTransition
      case "forbidden":
         return fa.tickets.errors.forbidden
      case "not_found":
         return fa.tickets.errors.notFound
      default:
         return fallback
   }
}

/** Server field errors for Formik; nested paths are flattened for simple ticket forms. */
export function flatFieldErrors(err: unknown): Record<string, string> | null {
   if (!(err instanceof ApiError) || !err.errors) return null
   return Object.keys(err.errors).length > 0 ? err.errors : null
}
