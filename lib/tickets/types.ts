import type { Role } from "@/lib/auth/permissions"
import type {
   TicketHistoryActionValue,
   TicketPriorityValue,
   TicketStatusValue,
   TicketTypeValue,
   TicketVisibilityValue,
} from "./validation"

/** The minimal account projection ticket payloads expose. */
export interface TicketActorDto {
   id: string
   firstName: string
   lastName: string
   username: string
   role: Role
}

export interface TicketCategoryRefDto {
   id: string
   name: string
}

export interface TicketCategoryDto extends TicketCategoryRefDto {
   description: string | null
   isActive: boolean
   sortOrder: number
   ticketCount: number
   createdAt: string
   updatedAt: string
}

export interface TicketCommentDto {
   id: string
   body: string
   visibility: TicketVisibilityValue
   author: TicketActorDto
   createdAt: string
}

export interface TicketHistoryDto {
   id: string
   action: TicketHistoryActionValue
   field: string | null
   fromValue: string | null
   toValue: string | null
   note: string | null
   visibility: TicketVisibilityValue
   actor: TicketActorDto | null
   createdAt: string
}

export interface TicketSummaryDto {
   id: string
   ticketNumber: string
   type: TicketTypeValue
   priority: TicketPriorityValue
   status: TicketStatusValue
   subject: string
   category: TicketCategoryRefDto
   requester: TicketActorDto
   assignee: TicketActorDto | null
   createdAt: string
   updatedAt: string
   lastActivityAt: string
}

export interface TicketDetailDto extends TicketSummaryDto {
   description: string
   resolutionNote: string | null
   resolvedAt: string | null
   closedAt: string | null
   cancelledAt: string | null
   comments: TicketCommentDto[]
   history: TicketHistoryDto[]
   commentsTruncated: boolean
   historyTruncated: boolean
}

export interface TicketStatsDto {
   total: number
   unassigned: number
   mine: number
   newCount: number
   inProgress: number
   resolved: number
   closed: number
   cancelled: number
   critical: number
}

export type TicketAssignedFilter = "unassigned" | "mine" | "assigned"

export interface TicketListParams {
   q?: string
   status?: string
   type?: string
   priority?: string
   categoryId?: string
   assigneeId?: string
   assigned?: TicketAssignedFilter
   page?: number
   pageSize?: number
   sort?: string
}

export interface TicketListResponse {
   tickets: TicketSummaryDto[]
   total: number
   page: number
   pageSize: number
   totalPages: number
   stats: TicketStatsDto
}

export interface TicketAssigneeOptionDto {
   id: string
   firstName: string
   lastName: string
   username: string
   role: Role
}

export interface TicketOptionsDto {
   categories: TicketCategoryRefDto[]
}

export interface AdminTicketOptionsDto extends TicketOptionsDto {
   assignees: TicketAssigneeOptionDto[]
}
