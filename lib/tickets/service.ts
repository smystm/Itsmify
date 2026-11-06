import "server-only"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { SessionUser } from "@/lib/auth/session"
import { can, type Action } from "@/lib/auth/permissions"
import { fa } from "@/lib/i18n/fa"
import {
   ADMIN_STATUS_TARGETS,
   EMPLOYEE_TICKET_PRIORITIES,
   TICKET_PRIORITIES,
   TICKET_SORTS,
   TICKET_STATUSES,
   TICKET_TYPES,
   UUID_RE,
   type AdminCommentInput,
   type AdminStatusInput,
   type AdminUpdateTicketInput,
   type AssignTicketInput,
   type CommentInput,
   type CreateTicketCategoryInput,
   type CreateTicketInput,
   type EmployeeStatusInput,
   type EmployeeUpdateTicketInput,
   type TicketHistoryActionValue,
   type TicketPriorityValue,
   type TicketStatusValue,
   type TicketTypeValue,
   type TicketVisibilityValue,
   type UpdateTicketCategoryInput,
} from "./validation"
import {
   allowedAdminStatusTargets,
   allowedEmployeeStatusTargets,
   canAddAdminComment,
   canAddEmployeeComment,
   canAssignAdminTicket,
   canChangeAdminPriorityCategory,
   canCreateCriticalPriority,
   canEditAdminContent,
   canEditEmployeeContent,
   isTerminalStatus,
   type TicketWorkflowState,
} from "./workflow"
import type {
   AdminTicketOptionsDto,
   TicketActorDto,
   TicketAssigneeOptionDto,
   TicketCategoryDto,
   TicketCategoryRefDto,
   TicketCommentDto,
   TicketDetailDto,
   TicketHistoryDto,
   TicketListParams,
   TicketListResponse,
   TicketOptionsDto,
   TicketStatsDto,
   TicketSummaryDto,
} from "./types"

const PREVIEW_LIMIT = 200

/* -------------------------------------------------------------------------- */
/* Errors                                                                      */
/* -------------------------------------------------------------------------- */

export class TicketServiceError extends Error {
   readonly code: string
   readonly status: number
   readonly fields?: Record<string, string>
   readonly details?: Record<string, unknown>

   constructor(
      code: string,
      status: number,
      options?: { fields?: Record<string, string>; details?: Record<string, unknown> },
   ) {
      super(code)
      this.name = "TicketServiceError"
      this.code = code
      this.status = status
      this.fields = options?.fields
      this.details = options?.details
   }
}

function isUniqueError(err: unknown): boolean {
   return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
}

export function ticketErrorResponse(err: unknown): Response {
   if (err instanceof TicketServiceError) {
      return Response.json(
         {
            error: err.code,
            ...(err.fields ? { fields: err.fields } : {}),
            ...(err.details ? { details: err.details } : {}),
         },
         { status: err.status },
      )
   }
   if (isUniqueError(err)) {
      return Response.json(
         { error: "duplicate", fields: { name: fa.tickets.errors.duplicateCategory } },
         { status: 422 },
      )
   }
   if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return Response.json({ error: "not_found" }, { status: 404 })
   }
   console.error("[tickets] unexpected error", err)
   return Response.json({ error: "internal" }, { status: 500 })
}

function assertAction(actor: SessionUser, action: Action): void {
   if (!can(actor.role, action)) {
      throw new TicketServiceError("forbidden", 403)
   }
}

function notFound(): TicketServiceError {
   return new TicketServiceError("not_found", 404)
}

function assertId(id: string): void {
   if (!UUID_RE.test(id)) throw notFound()
}

/* -------------------------------------------------------------------------- */
/* Projections and mappers                                                     */
/* -------------------------------------------------------------------------- */

const actorSelect = {
   id: true,
   firstName: true,
   lastName: true,
   username: true,
   role: true,
} as const satisfies Prisma.UserSelect

const categoryRefSelect = { id: true, name: true } as const satisfies Prisma.TicketCategorySelect

const ticketSummarySelect = {
   id: true,
   ticketNumber: true,
   type: true,
   priority: true,
   status: true,
   subject: true,
   createdAt: true,
   updatedAt: true,
   lastActivityAt: true,
   category: { select: categoryRefSelect },
   requester: { select: actorSelect },
   assignee: { select: actorSelect },
} as const satisfies Prisma.TicketSelect

const ticketDetailBaseSelect = {
   ...ticketSummarySelect,
   description: true,
   resolutionNote: true,
   resolvedAt: true,
   closedAt: true,
   cancelledAt: true,
} as const satisfies Prisma.TicketSelect

const mutationTicketSelect = {
   id: true,
   requesterId: true,
   assigneeId: true,
   status: true,
   type: true,
   priority: true,
   subject: true,
   description: true,
   categoryId: true,
   resolutionNote: true,
   category: { select: categoryRefSelect },
   assignee: { select: actorSelect },
} as const satisfies Prisma.TicketSelect

const commentSelect = {
   id: true,
   body: true,
   visibility: true,
   createdAt: true,
   author: { select: actorSelect },
} as const satisfies Prisma.TicketCommentSelect

const historySelect = {
   id: true,
   action: true,
   field: true,
   fromValue: true,
   toValue: true,
   note: true,
   visibility: true,
   createdAt: true,
   actor: { select: actorSelect },
} as const satisfies Prisma.TicketHistorySelect

const categoryListSelect = {
   ...categoryRefSelect,
   description: true,
   isActive: true,
   sortOrder: true,
   createdAt: true,
   updatedAt: true,
   _count: { select: { tickets: true } },
} as const satisfies Prisma.TicketCategorySelect

type ActorRow = { id: string; firstName: string; lastName: string; username: string; role: string }
type SummaryRow = Prisma.TicketGetPayload<{ select: typeof ticketSummarySelect }>
type MutationRow = Prisma.TicketGetPayload<{ select: typeof mutationTicketSelect }>
type CommentRow = Prisma.TicketCommentGetPayload<{ select: typeof commentSelect }>
type HistoryRow = Prisma.TicketHistoryGetPayload<{ select: typeof historySelect }>
type CategoryListRow = Prisma.TicketCategoryGetPayload<{ select: typeof categoryListSelect }>

function mapActor(row: ActorRow): TicketActorDto {
   return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      username: row.username,
      role: row.role as TicketActorDto["role"],
   }
}

function mapCategoryRef(row: { id: string; name: string }): TicketCategoryRefDto {
   return { id: row.id, name: row.name }
}

function mapSummary(row: SummaryRow): TicketSummaryDto {
   return {
      id: row.id,
      ticketNumber: row.ticketNumber,
      type: row.type,
      priority: row.priority,
      status: row.status,
      subject: row.subject,
      category: mapCategoryRef(row.category),
      requester: mapActor(row.requester),
      assignee: row.assignee ? mapActor(row.assignee) : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      lastActivityAt: row.lastActivityAt.toISOString(),
   }
}

function mapComment(row: CommentRow): TicketCommentDto {
   return {
      id: row.id,
      body: row.body,
      visibility: row.visibility,
      author: mapActor(row.author),
      createdAt: row.createdAt.toISOString(),
   }
}

function mapHistory(row: HistoryRow): TicketHistoryDto {
   return {
      id: row.id,
      action: row.action,
      field: row.field,
      fromValue: row.fromValue,
      toValue: row.toValue,
      note: row.note,
      visibility: row.visibility,
      actor: row.actor ? mapActor(row.actor) : null,
      createdAt: row.createdAt.toISOString(),
   }
}

function mapCategory(row: CategoryListRow): TicketCategoryDto {
   return {
      id: row.id,
      name: row.name,
      description: row.description,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      ticketCount: row._count.tickets,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
   }
}

function workflowState(row: Pick<MutationRow, "requesterId" | "assigneeId" | "status">): TicketWorkflowState {
   return {
      requesterId: row.requesterId,
      assigneeId: row.assigneeId,
      status: row.status,
   }
}

/* -------------------------------------------------------------------------- */
/* Detail reads                                                               */
/* -------------------------------------------------------------------------- */

async function loadDetail(
   id: string,
   includeInternal: boolean,
   requesterId?: string,
): Promise<TicketDetailDto | null> {
   const row = await prisma.ticket.findFirst({
      where: { id, ...(requesterId ? { requesterId } : {}) },
      select: ticketDetailBaseSelect,
   })
   if (!row) return null

   const visibilityWhere = includeInternal ? {} : { visibility: "PUBLIC" as const }
   const [comments, history] = await Promise.all([
      prisma.ticketComment.findMany({
         where: { ticketId: id, ...visibilityWhere },
         orderBy: [{ createdAt: "desc" }, { id: "desc" }],
         take: PREVIEW_LIMIT + 1,
         select: commentSelect,
      }),
      prisma.ticketHistory.findMany({
         where: { ticketId: id, ...visibilityWhere },
         orderBy: [{ createdAt: "desc" }, { id: "desc" }],
         take: PREVIEW_LIMIT + 1,
         select: historySelect,
      }),
   ])

   const commentsTruncated = comments.length > PREVIEW_LIMIT
   const historyTruncated = history.length > PREVIEW_LIMIT

   return {
      ...mapSummary(row),
      description: row.description,
      resolutionNote: row.resolutionNote,
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      closedAt: row.closedAt?.toISOString() ?? null,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      comments: comments.slice(0, PREVIEW_LIMIT).reverse().map(mapComment),
      history: history.slice(0, PREVIEW_LIMIT).reverse().map(mapHistory),
      commentsTruncated,
      historyTruncated,
   }
}

export async function getMyTicketDetail(actor: SessionUser, id: string): Promise<TicketDetailDto> {
   assertAction(actor, "tickets.read.own")
   assertId(id)
   const ticket = await loadDetail(id, false, actor.id)
   if (!ticket) throw notFound()
   return ticket
}

export async function getAdminTicketDetail(actor: SessionUser, id: string): Promise<TicketDetailDto> {
   assertAction(actor, "tickets.read.all")
   assertId(id)
   const ticket = await loadDetail(id, true)
   if (!ticket) throw notFound()
   return ticket
}

/* -------------------------------------------------------------------------- */
/* Stats                                                                      */
/* -------------------------------------------------------------------------- */

function emptyStats(): TicketStatsDto {
   return {
      total: 0,
      unassigned: 0,
      mine: 0,
      newCount: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      cancelled: 0,
      critical: 0,
   }
}

async function loadEmployeeStats(actorId: string): Promise<TicketStatsDto> {
   const mine = { requesterId: actorId }
   const [total, newCount, inProgress, resolved, closed, cancelled, critical] = await Promise.all([
      prisma.ticket.count({ where: mine }),
      prisma.ticket.count({ where: { ...mine, status: "NEW" } }),
      prisma.ticket.count({ where: { ...mine, status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { ...mine, status: "RESOLVED" } }),
      prisma.ticket.count({ where: { ...mine, status: "CLOSED" } }),
      prisma.ticket.count({ where: { ...mine, status: "CANCELLED" } }),
      prisma.ticket.count({ where: { ...mine, priority: "CRITICAL" } }),
   ])
   return { ...emptyStats(), total, newCount, inProgress, resolved, closed, cancelled, critical }
}

async function loadAdminStats(actorId: string): Promise<TicketStatsDto> {
   const openStatuses = { in: ["NEW", "IN_PROGRESS", "RESOLVED"] as TicketStatusValue[] }
   const [total, unassigned, mine, newCount, inProgress, resolved, cancelled, critical] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { assigneeId: null, status: openStatuses } }),
      prisma.ticket.count({ where: { assigneeId: actorId, status: openStatuses } }),
      prisma.ticket.count({ where: { status: "NEW" } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { status: "RESOLVED" } }),
      prisma.ticket.count({ where: { status: "CANCELLED" } }),
      prisma.ticket.count({ where: { priority: "CRITICAL", status: openStatuses } }),
   ])
   return { ...emptyStats(), total, unassigned, mine, newCount, inProgress, resolved, cancelled, critical }
}

/* -------------------------------------------------------------------------- */
/* Lists                                                                      */
/* -------------------------------------------------------------------------- */

function pagination(params: TicketListParams): { page: number; pageSize: number } {
   const page = Math.max(1, Number.isFinite(params.page) ? Math.trunc(params.page ?? 1) : 1)
   const pageSize = Math.min(100, Math.max(1, Number.isFinite(params.pageSize) ? Math.trunc(params.pageSize ?? 20) : 20))
   return { page, pageSize }
}

function ticketFilters(params: TicketListParams): Prisma.TicketWhereInput {
   const q = (params.q?.trim() ?? "").slice(0, 200)
   const status = TICKET_STATUSES.includes(params.status as TicketStatusValue)
      ? (params.status as TicketStatusValue)
      : undefined
   const type = TICKET_TYPES.includes(params.type as TicketTypeValue)
      ? (params.type as TicketTypeValue)
      : undefined
   const priority = TICKET_PRIORITIES.includes(params.priority as TicketPriorityValue)
      ? (params.priority as TicketPriorityValue)
      : undefined
   const categoryId = params.categoryId && UUID_RE.test(params.categoryId) ? params.categoryId : undefined
   const assigneeId = params.assigneeId && UUID_RE.test(params.assigneeId) ? params.assigneeId : undefined

   return {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(priority ? { priority } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(q
         ? {
              OR: [
                 { ticketNumber: { contains: q, mode: "insensitive" } },
                 { subject: { contains: q, mode: "insensitive" } },
              ],
           }
         : {}),
      ...(assigneeId ? { assigneeId } : {}),
   }
}

function orderBy(params: TicketListParams): Prisma.TicketOrderByWithRelationInput[] {
   const sort = TICKET_SORTS.includes(params.sort as (typeof TICKET_SORTS)[number]) ? params.sort : undefined
   switch (sort) {
      case "oldest":
         return [{ createdAt: "asc" }, { id: "asc" }]
      case "updated":
         return [{ lastActivityAt: "desc" }, { id: "desc" }]
      case "priority":
         return [{ priority: "desc" }, { createdAt: "desc" }, { id: "desc" }]
      default:
         return [{ createdAt: "desc" }, { id: "desc" }]
   }
}

export async function listMyTickets(actor: SessionUser, params: TicketListParams): Promise<TicketListResponse> {
   assertAction(actor, "tickets.read.own")
   const { page, pageSize } = pagination(params)
   const where: Prisma.TicketWhereInput = { ...ticketFilters(params), requesterId: actor.id }

   const [rows, total, stats] = await Promise.all([
      prisma.ticket.findMany({
         where,
         orderBy: orderBy(params),
         skip: (page - 1) * pageSize,
         take: pageSize,
         select: ticketSummarySelect,
      }),
      prisma.ticket.count({ where }),
      loadEmployeeStats(actor.id),
   ])

   return {
      tickets: rows.map(mapSummary),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      stats,
   }
}

export async function listAdminTickets(actor: SessionUser, params: TicketListParams): Promise<TicketListResponse> {
   assertAction(actor, "tickets.read.all")
   const { page, pageSize } = pagination(params)
   const filters = ticketFilters(params)
   const assignmentFilter: Prisma.TicketWhereInput | undefined =
      params.assigned === "unassigned"
         ? { assigneeId: null }
         : params.assigned === "mine"
           ? { assigneeId: actor.id }
           : params.assigned === "assigned"
             ? { assigneeId: { not: null } }
             : undefined
   const explicitAssignee = params.assigneeId && UUID_RE.test(params.assigneeId)
   const where: Prisma.TicketWhereInput = { ...filters, ...(explicitAssignee ? {} : assignmentFilter) }

   const [rows, total, stats] = await Promise.all([
      prisma.ticket.findMany({
         where,
         orderBy: orderBy(params),
         skip: (page - 1) * pageSize,
         take: pageSize,
         select: ticketSummarySelect,
      }),
      prisma.ticket.count({ where }),
      loadAdminStats(actor.id),
   ])

   return {
      tickets: rows.map(mapSummary),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      stats,
   }
}

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

const activeCategorySelect = { id: true, name: true } as const satisfies Prisma.TicketCategorySelect

async function activeCategoryOptions(): Promise<TicketCategoryRefDto[]> {
   const rows = await prisma.ticketCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: activeCategorySelect,
   })
   return rows.map(mapCategoryRef)
}

export async function getMyTicketOptions(actor: SessionUser): Promise<TicketOptionsDto> {
   if (!can(actor.role, "tickets.read.own") && !can(actor.role, "tickets.submit")) {
      throw new TicketServiceError("forbidden", 403)
   }
   return { categories: await activeCategoryOptions() }
}

export async function getAdminTicketOptions(actor: SessionUser): Promise<AdminTicketOptionsDto> {
   assertAction(actor, "tickets.read.all")
   const [categories, assignees] = await Promise.all([
      activeCategoryOptions(),
      prisma.user.findMany({
         where: {
            deletedAt: null,
            status: "ACTIVE",
            role: { in: ["IT_SPECIALIST", "IT_MANAGER"] },
         },
         orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
         select: actorSelect,
      }),
   ])
   return {
      categories,
      assignees: assignees.map(
         (row): TicketAssigneeOptionDto => ({
            id: row.id,
            firstName: row.firstName,
            lastName: row.lastName,
            username: row.username,
            role: row.role as TicketAssigneeOptionDto["role"],
         }),
      ),
   }
}

/* -------------------------------------------------------------------------- */
/* Create and update                                                          */
/* -------------------------------------------------------------------------- */

async function lockTicket(tx: Prisma.TransactionClient, id: string): Promise<MutationRow> {
   const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "tickets" WHERE "id" = ${id}::uuid FOR UPDATE
   `
   if (!locked[0]) throw notFound()
   return tx.ticket.findUniqueOrThrow({ where: { id }, select: mutationTicketSelect })
}

function historyValues(
   action: TicketHistoryActionValue,
   values: {
      field?: string | null
      fromValue?: string | null
      toValue?: string | null
      note?: string | null
      visibility?: TicketVisibilityValue
   },
): Omit<Prisma.TicketHistoryCreateManyInput, "ticketId" | "actorId"> {
   return {
      action,
      field: values.field ?? null,
      fromValue: values.fromValue ?? null,
      toValue: values.toValue ?? null,
      note: values.note ?? null,
      visibility: values.visibility ?? "PUBLIC",
   }
}

export async function createTicket(actor: SessionUser, input: CreateTicketInput): Promise<TicketDetailDto> {
   assertAction(actor, "tickets.submit")
   if (!canCreateCriticalPriority(actor.role) && !(EMPLOYEE_TICKET_PRIORITIES as readonly string[]).includes(input.priority)) {
      throw new TicketServiceError("validation", 422, {
         fields: { priority: fa.tickets.validation.employeePriority },
      })
   }

   const createdId = await prisma.$transaction(async (tx) => {
      const category = await tx.ticketCategory.findFirst({
         where: { id: input.categoryId, isActive: true },
         select: { id: true },
      })
      if (!category) {
         throw new TicketServiceError("category_inactive", 422, {
            fields: { categoryId: fa.tickets.errors.categoryInactive },
         })
      }

      const created = await tx.ticket.create({
         data: {
            type: input.type as TicketTypeValue,
            priority: input.priority as TicketPriorityValue,
            subject: input.subject,
            description: input.description,
            categoryId: category.id,
            requesterId: actor.id,
         },
         select: { id: true },
      })

      await tx.ticketHistory.create({
         data: {
            ticketId: created.id,
            actorId: actor.id,
            action: "CREATED",
            visibility: "PUBLIC",
         },
      })

      return created.id
   })

   return getMyTicketDetail(actor, createdId)
}

type TicketChanges = {
   data: Prisma.TicketUncheckedUpdateInput
   history: Omit<Prisma.TicketHistoryCreateManyInput, "ticketId" | "actorId">[]
}

function emptyChanges(): TicketChanges {
   return { data: {}, history: [] }
}

function collectContentChanges(
   changes: TicketChanges,
   current: MutationRow,
   input: { type?: string | null; subject?: string | null; description?: string | null },
): void {
   if (input.type && input.type !== current.type) {
      changes.data.type = input.type as TicketTypeValue
      changes.history.push(
         historyValues("UPDATED", {
            field: "type",
            fromValue: current.type,
            toValue: input.type,
         }),
      )
   }
   if (input.subject && input.subject !== current.subject) {
      changes.data.subject = input.subject
      changes.history.push(
         historyValues("UPDATED", {
            field: "subject",
            fromValue: current.subject,
            toValue: input.subject,
         }),
      )
   }
   if (input.description && input.description !== current.description) {
      changes.data.description = input.description
      // Description text is not duplicated into the history payload.
      changes.history.push(historyValues("UPDATED", { field: "description" }))
   }
}

function applyChanges(changes: TicketChanges): Prisma.TicketUncheckedUpdateInput | null {
   if (changes.history.length === 0) return null
   return { ...changes.data, lastActivityAt: new Date() }
}

export async function updateMyTicket(
   actor: SessionUser,
   id: string,
   input: EmployeeUpdateTicketInput,
): Promise<TicketDetailDto> {
   assertAction(actor, "tickets.read.own")
   assertId(id)

   await prisma.$transaction(async (tx) => {
      const current = await lockTicket(tx, id)
      if (current.requesterId !== actor.id) throw notFound()
      if (isTerminalStatus(current.status)) throw new TicketServiceError("terminal_ticket", 409)

      const changes = emptyChanges()
      collectContentChanges(changes, current, input)
      if (changes.history.length > 0 && !canEditEmployeeContent(actor.id, workflowState(current))) {
         throw new TicketServiceError("ticket_immutable", 409)
      }

      const data = applyChanges(changes)
      if (!data) return

      await tx.ticket.update({ where: { id }, data })
      await tx.ticketHistory.createMany({
         data: changes.history.map((row) => ({ ...row, ticketId: id, actorId: actor.id })),
      })
   })

   return getMyTicketDetail(actor, id)
}

export async function updateAdminTicket(
   actor: SessionUser,
   id: string,
   input: AdminUpdateTicketInput,
): Promise<TicketDetailDto> {
   assertAction(actor, "tickets.update")
   assertId(id)

   await prisma.$transaction(async (tx) => {
      const current = await lockTicket(tx, id)
      const state = workflowState(current)
      if (isTerminalStatus(current.status)) throw new TicketServiceError("terminal_ticket", 409)

      const changes = emptyChanges()
      collectContentChanges(changes, current, input)

      if (changes.history.length > 0) {
         if (current.status !== "NEW") throw new TicketServiceError("ticket_immutable", 409)
         if (!canEditAdminContent(actor.role, actor.id, state)) {
            throw new TicketServiceError("forbidden", 403)
         }
      }

      const priorityChanged = Boolean(input.priority && input.priority !== current.priority)
      const categoryChanged = Boolean(input.categoryId && input.categoryId !== current.categoryId)
      if ((priorityChanged || categoryChanged) && !canChangeAdminPriorityCategory(actor.role, actor.id, state)) {
         throw new TicketServiceError("forbidden", 403)
      }

      if (priorityChanged && input.priority) {
         changes.data.priority = input.priority as TicketPriorityValue
         changes.history.push(
            historyValues("PRIORITY_CHANGED", {
               field: "priority",
               fromValue: current.priority,
               toValue: input.priority,
            }),
         )
      }

      if (categoryChanged && input.categoryId) {
         const category = await tx.ticketCategory.findFirst({
            where: { id: input.categoryId, isActive: true },
            select: { id: true, name: true },
         })
         if (!category) {
            throw new TicketServiceError("category_inactive", 422, {
               fields: { categoryId: fa.tickets.errors.categoryInactive },
            })
         }
         changes.data.categoryId = category.id
         changes.history.push(
            historyValues("CATEGORY_CHANGED", {
               field: "category",
               fromValue: current.category.name,
               toValue: category.name,
            }),
         )
      }

      const data = applyChanges(changes)
      if (!data) return

      await tx.ticket.update({ where: { id }, data })
      await tx.ticketHistory.createMany({
         data: changes.history.map((row) => ({ ...row, ticketId: id, actorId: actor.id })),
      })
   })

   return getAdminTicketDetail(actor, id)
}

/* -------------------------------------------------------------------------- */
/* Assignment                                                                 */
/* -------------------------------------------------------------------------- */

export async function assignAdminTicket(
   actor: SessionUser,
   id: string,
   input: AssignTicketInput,
): Promise<TicketDetailDto> {
   assertAction(actor, "tickets.assign")
   assertId(id)

   await prisma.$transaction(async (tx) => {
      const current = await lockTicket(tx, id)
      const state = workflowState(current)
      if (isTerminalStatus(current.status)) throw new TicketServiceError("terminal_ticket", 409)

      if (actor.role === "IT_SPECIALIST" && input.assigneeId !== actor.id) {
         throw new TicketServiceError("forbidden", 403)
      }
      if (
         actor.role === "IT_SPECIALIST" &&
         current.assigneeId !== null &&
         current.assigneeId !== actor.id
      ) {
         throw new TicketServiceError("already_assigned", 409)
      }
      if (!canAssignAdminTicket(actor.role, actor.id, state)) {
         throw new TicketServiceError("forbidden", 403)
      }

      if (current.assigneeId === input.assigneeId) return

      const assignee = await tx.user.findFirst({
         where: {
            id: input.assigneeId,
            deletedAt: null,
            status: "ACTIVE",
            role: { in: ["IT_SPECIALIST", "IT_MANAGER"] },
         },
         select: { id: true, firstName: true, lastName: true },
      })
      if (!assignee) {
         throw new TicketServiceError("assignee_not_eligible", 422, {
            fields: { assigneeId: fa.tickets.errors.assigneeNotEligible },
         })
      }

      const now = new Date()
      const nextStatus: TicketStatusValue = current.status === "NEW" ? "IN_PROGRESS" : current.status
      const data: Prisma.TicketUncheckedUpdateInput = {
         assigneeId: assignee.id,
         lastActivityAt: now,
         ...(current.status === "NEW" ? { status: nextStatus } : {}),
      }

      await tx.ticket.update({ where: { id }, data })

      const history: Omit<Prisma.TicketHistoryCreateManyInput, "ticketId" | "actorId">[] = [
         historyValues("ASSIGNED", {
            field: "assignee",
            fromValue: current.assignee ? `${current.assignee.firstName} ${current.assignee.lastName}` : null,
            toValue: `${assignee.firstName} ${assignee.lastName}`,
         }),
      ]
      if (current.status === "NEW") {
         history.push(
            historyValues("STATUS_CHANGED", {
               field: "status",
               fromValue: "NEW",
               toValue: "IN_PROGRESS",
            }),
         )
      }

      await tx.ticketHistory.createMany({
         data: history.map((row) => ({ ...row, ticketId: id, actorId: actor.id })),
      })
   })

   return getAdminTicketDetail(actor, id)
}

/* -------------------------------------------------------------------------- */
/* Status transitions                                                         */
/* -------------------------------------------------------------------------- */

export async function changeMyTicketStatus(
   actor: SessionUser,
   id: string,
   input: EmployeeStatusInput,
): Promise<TicketDetailDto> {
   assertAction(actor, "tickets.read.own")
   assertId(id)

   await prisma.$transaction(async (tx) => {
      const current = await lockTicket(tx, id)
      if (current.requesterId !== actor.id) throw notFound()
      if (isTerminalStatus(current.status)) throw new TicketServiceError("terminal_ticket", 409)

      const target = input.status as TicketStatusValue
      const allowed = allowedEmployeeStatusTargets(actor.id, workflowState(current))
      if (!allowed.includes(target)) {
         throw new TicketServiceError("invalid_transition", 409, {
            details: { currentStatus: current.status },
         })
      }

      const now = new Date()
      const data: Prisma.TicketUncheckedUpdateInput = {
         status: target,
         lastActivityAt: now,
      }
      if (target === "CANCELLED") data.cancelledAt = now
      if (target === "CLOSED") data.closedAt = now
      if (target === "IN_PROGRESS") {
         data.resolvedAt = null
         data.resolutionNote = null
      }

      await tx.ticket.update({ where: { id }, data })
      await tx.ticketHistory.create({
         data: {
            ticketId: id,
            actorId: actor.id,
            action: "STATUS_CHANGED",
            field: "status",
            fromValue: current.status,
            toValue: target,
            note: input.note || null,
            visibility: "PUBLIC",
         },
      })
   })

   return getMyTicketDetail(actor, id)
}

export async function changeAdminTicketStatus(
   actor: SessionUser,
   id: string,
   input: AdminStatusInput,
): Promise<TicketDetailDto> {
   assertAction(actor, "tickets.resolve")
   assertId(id)

   const target = input.status as TicketStatusValue
   if (!ADMIN_STATUS_TARGETS.includes(target as (typeof ADMIN_STATUS_TARGETS)[number])) {
      throw new TicketServiceError("invalid_transition", 409)
   }
   const resolutionNote = (input.resolutionNote ?? "").trim()
   if (target === "RESOLVED" && resolutionNote.length < 5) {
      throw new TicketServiceError("validation", 422, {
         fields: { resolutionNote: fa.tickets.validation.resolutionNoteShort },
      })
   }

   await prisma.$transaction(async (tx) => {
      const current = await lockTicket(tx, id)
      if (isTerminalStatus(current.status)) throw new TicketServiceError("terminal_ticket", 409)

      const allowed = allowedAdminStatusTargets(actor.role, actor.id, workflowState(current))
      if (!allowed.includes(target)) {
         throw new TicketServiceError("invalid_transition", 409, {
            details: { currentStatus: current.status },
         })
      }

      const now = new Date()
      const data: Prisma.TicketUncheckedUpdateInput = {
         status: target,
         lastActivityAt: now,
      }
      if (target === "RESOLVED") {
         data.resolvedAt = now
         data.resolutionNote = resolutionNote
      }
      if (target === "CLOSED") data.closedAt = now
      if (target === "CANCELLED") data.cancelledAt = now
      if (target === "IN_PROGRESS") {
         data.resolvedAt = null
         data.resolutionNote = null
      }

      await tx.ticket.update({ where: { id }, data })
      await tx.ticketHistory.create({
         data: {
            ticketId: id,
            actorId: actor.id,
            action: "STATUS_CHANGED",
            field: "status",
            fromValue: current.status,
            toValue: target,
            note: target === "RESOLVED" ? resolutionNote : input.note || null,
            visibility: "PUBLIC",
         },
      })
   })

   return getAdminTicketDetail(actor, id)
}

/* -------------------------------------------------------------------------- */
/* Comments                                                                   */
/* -------------------------------------------------------------------------- */

export async function addMyTicketComment(
   actor: SessionUser,
   id: string,
   input: CommentInput,
): Promise<TicketCommentDto> {
   assertAction(actor, "tickets.read.own")
   assertId(id)

   const comment = await prisma.$transaction(async (tx) => {
      const current = await lockTicket(tx, id)
      if (current.requesterId !== actor.id) throw notFound()
      if (isTerminalStatus(current.status)) throw new TicketServiceError("terminal_ticket", 409)
      if (!canAddEmployeeComment(actor.id, workflowState(current))) {
         throw new TicketServiceError("forbidden", 403)
      }

      const created = await tx.ticketComment.create({
         data: {
            ticketId: id,
            authorId: actor.id,
            body: input.body,
            visibility: "PUBLIC",
         },
         select: commentSelect,
      })
      await tx.ticket.update({ where: { id }, data: { lastActivityAt: new Date() } })
      await tx.ticketHistory.create({
         data: {
            ticketId: id,
            actorId: actor.id,
            action: "COMMENT_ADDED",
            field: "visibility",
            toValue: "PUBLIC",
            visibility: "PUBLIC",
         },
      })
      return created
   })

   return mapComment(comment)
}

export async function addAdminTicketComment(
   actor: SessionUser,
   id: string,
   input: AdminCommentInput,
): Promise<TicketCommentDto> {
   assertAction(actor, "tickets.read.all")
   assertId(id)

   const comment = await prisma.$transaction(async (tx) => {
      const current = await lockTicket(tx, id)
      if (isTerminalStatus(current.status)) throw new TicketServiceError("terminal_ticket", 409)
      if (!canAddAdminComment(actor.role, actor.id, workflowState(current))) {
         throw new TicketServiceError("forbidden", 403)
      }

      const visibility = input.visibility as TicketVisibilityValue
      const created = await tx.ticketComment.create({
         data: {
            ticketId: id,
            authorId: actor.id,
            body: input.body,
            visibility,
         },
         select: commentSelect,
      })
      await tx.ticket.update({ where: { id }, data: { lastActivityAt: new Date() } })
      await tx.ticketHistory.create({
         data: {
            ticketId: id,
            actorId: actor.id,
            action: "COMMENT_ADDED",
            field: "visibility",
            toValue: visibility,
            visibility,
         },
      })
      return created
   })

   return mapComment(comment)
}

/* -------------------------------------------------------------------------- */
/* Categories                                                                 */
/* -------------------------------------------------------------------------- */

export async function listTicketCategories(actor: SessionUser): Promise<TicketCategoryDto[]> {
   assertAction(actor, "tickets.categories.manage")
   const rows = await prisma.ticketCategory.findMany({
      orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: categoryListSelect,
   })
   return rows.map(mapCategory)
}

function normalizedName(name: string): string {
   return name.trim().replace(/\s+/g, " ")
}

export async function createTicketCategory(
   actor: SessionUser,
   input: CreateTicketCategoryInput,
): Promise<TicketCategoryDto> {
   assertAction(actor, "tickets.categories.manage")
   try {
      const row = await prisma.ticketCategory.create({
         data: {
            name: normalizedName(input.name),
            description: input.description?.trim() || null,
            sortOrder: input.sortOrder ?? 0,
            isActive: input.isActive ?? true,
         },
         select: categoryListSelect,
      })
      return mapCategory(row)
   } catch (err) {
      if (isUniqueError(err)) {
         throw new TicketServiceError("duplicate", 422, {
            fields: { name: fa.tickets.errors.duplicateCategory },
         })
      }
      throw err
   }
}

export async function updateTicketCategory(
   actor: SessionUser,
   id: string,
   input: UpdateTicketCategoryInput,
): Promise<TicketCategoryDto> {
   assertAction(actor, "tickets.categories.manage")
   assertId(id)

   try {
      const row = await prisma.$transaction(async (tx) => {
         const locked = await tx.$queryRaw<{ id: string; name: string }[]>`
            SELECT "id", "name" FROM "ticket_categories" WHERE "id" = ${id}::uuid FOR UPDATE
         `
         if (!locked[0]) throw notFound()

         const data: Prisma.TicketCategoryUpdateInput = {}
         if (input.name != null) data.name = normalizedName(input.name)
         if (input.description !== undefined) data.description = input.description?.trim() || null
         if (input.sortOrder != null) data.sortOrder = input.sortOrder
         if (input.isActive != null) data.isActive = input.isActive

         const updated = await tx.ticketCategory.update({
            where: { id },
            data,
            select: categoryListSelect,
         })
         return updated
      })
      return mapCategory(row)
   } catch (err) {
      if (isUniqueError(err)) {
         throw new TicketServiceError("duplicate", 422, {
            fields: { name: fa.tickets.errors.duplicateCategory },
         })
      }
      throw err
   }
}
