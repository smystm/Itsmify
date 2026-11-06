import type { Role } from "@/lib/auth/permissions"
import type { TicketStatusValue } from "./validation"

/**
 * Pure ticket authorization rules. This module deliberately has no Prisma,
 * server-only or React imports so the same predicates drive API decisions and
 * the Phase 3 UI.
 *
 * `TicketWorkflowState` is the minimum ticket projection the rules need.
 */
export interface TicketWorkflowState {
   requesterId: string
   assigneeId: string | null
   status: TicketStatusValue
}

export type TicketStatusTarget = TicketStatusValue

const TERMINAL_STATUSES: TicketStatusValue[] = ["CLOSED", "CANCELLED"]

export function isTerminalStatus(status: TicketStatusValue): boolean {
   return TERMINAL_STATUSES.includes(status)
}

export function isManagerialRole(role: Role): boolean {
   return role === "IT_MANAGER" || role === "SYS_ADMIN"
}

export function isItRole(role: Role): boolean {
   return role === "IT_SPECIALIST" || isManagerialRole(role)
}

export function isSpecialistRole(role: Role): boolean {
   return role === "IT_SPECIALIST"
}

export function ownsTicket(actorId: string, ticket: TicketWorkflowState): boolean {
   return ticket.requesterId === actorId
}

/** Specialists may act on unassigned tickets and on tickets assigned to themselves. */
export function withinSpecialistScope(actorId: string, ticket: TicketWorkflowState): boolean {
   return ticket.assigneeId === null || ticket.assigneeId === actorId
}

/** Assumption: only IT roles may select CRITICAL. Employees are capped at HIGH. */
export function canCreateCriticalPriority(role: Role): boolean {
   return role !== "EMPLOYEE"
}

export function canEditEmployeeContent(actorId: string, ticket: TicketWorkflowState): boolean {
   return ownsTicket(actorId, ticket) && ticket.status === "NEW"
}

/** Assumption: specialists may edit employee-written content while it is NEW and unassigned. */
export function canEditAdminContent(role: Role, actorId: string, ticket: TicketWorkflowState): boolean {
   if (ticket.status !== "NEW") return false
   if (isManagerialRole(role)) return true
   return isSpecialistRole(role) && withinSpecialistScope(actorId, ticket)
}

export function canChangeAdminPriorityCategory(role: Role, actorId: string, ticket: TicketWorkflowState): boolean {
   if (isTerminalStatus(ticket.status)) return false
   if (isManagerialRole(role)) return true
   return isSpecialistRole(role) && withinSpecialistScope(actorId, ticket)
}

export function canAssignAdminTicket(role: Role, actorId: string, ticket: TicketWorkflowState): boolean {
   if (isTerminalStatus(ticket.status)) return false
   if (isManagerialRole(role)) return true
   return isSpecialistRole(role) && withinSpecialistScope(actorId, ticket)
}

export function canAddEmployeeComment(actorId: string, ticket: TicketWorkflowState): boolean {
   return ownsTicket(actorId, ticket) && !isTerminalStatus(ticket.status)
}

export function canAddAdminComment(role: Role, actorId: string, ticket: TicketWorkflowState): boolean {
   if (isTerminalStatus(ticket.status)) return false
   if (isManagerialRole(role)) return true
   return isSpecialistRole(role) && withinSpecialistScope(actorId, ticket)
}

/** Employees may cancel NEW, then close or reopen their own RESOLVED tickets. */
export function allowedEmployeeStatusTargets(
   actorId: string,
   ticket: TicketWorkflowState,
): TicketStatusTarget[] {
   if (!ownsTicket(actorId, ticket)) return []
   if (ticket.status === "NEW") return ["CANCELLED"]
   if (ticket.status === "RESOLVED") return ["CLOSED", "IN_PROGRESS"]
   return []
}

/**
 * Admin status targets. Assignment is the only path to IN_PROGRESS from NEW.
 * Assumption: specialists cannot cancel; cancellation is manager-only.
 */
export function allowedAdminStatusTargets(
   role: Role,
   actorId: string,
   ticket: TicketWorkflowState,
): TicketStatusTarget[] {
   if (isTerminalStatus(ticket.status)) return []

   if (isManagerialRole(role)) {
      if (ticket.status === "NEW") return ["CANCELLED"]
      if (ticket.status === "IN_PROGRESS") return ["RESOLVED", "CANCELLED"]
      if (ticket.status === "RESOLVED") return ["CLOSED", "IN_PROGRESS"]
      return []
   }

   if (!isSpecialistRole(role) || ticket.assigneeId !== actorId) return []

   if (ticket.status === "IN_PROGRESS") return ["RESOLVED"]
   if (ticket.status === "RESOLVED") return ["CLOSED", "IN_PROGRESS"]
   return []
}
