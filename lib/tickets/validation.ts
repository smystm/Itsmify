import * as yup from "yup"
import { fa } from "@/lib/i18n/fa"

/**
 * Ticket constants and shared schemas. The enums mirror the Prisma models; the
 * service casts validated strings, so a schema change and a database change
 * must stay in step.
 */

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const TICKET_TYPES = ["INCIDENT", "SERVICE_REQUEST"] as const
export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const
export const TICKET_STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"] as const
export const TICKET_VISIBILITIES = ["PUBLIC", "INTERNAL"] as const
export const TICKET_HISTORY_ACTIONS = [
   "CREATED",
   "UPDATED",
   "ASSIGNED",
   "STATUS_CHANGED",
   "PRIORITY_CHANGED",
   "CATEGORY_CHANGED",
   "COMMENT_ADDED",
] as const
export const TICKET_SORTS = ["newest", "oldest", "updated", "priority"] as const

/** Employees may not raise a ticket above HIGH. */
export const EMPLOYEE_TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const

/** Status targets reachable from the employee status endpoint. */
export const EMPLOYEE_STATUS_TARGETS = ["CANCELLED", "CLOSED", "IN_PROGRESS"] as const

/** Status targets reachable from the admin status endpoint. Assignment owns NEW → IN_PROGRESS. */
export const ADMIN_STATUS_TARGETS = ["RESOLVED", "CLOSED", "CANCELLED", "IN_PROGRESS"] as const

export type TicketTypeValue = (typeof TICKET_TYPES)[number]
export type TicketPriorityValue = (typeof TICKET_PRIORITIES)[number]
export type TicketStatusValue = (typeof TICKET_STATUSES)[number]
export type TicketVisibilityValue = (typeof TICKET_VISIBILITIES)[number]
export type TicketHistoryActionValue = (typeof TICKET_HISTORY_ACTIONS)[number]
export type TicketSortValue = (typeof TICKET_SORTS)[number]

const optionalText = (max: number, message: string) => yup.string().trim().max(max, message).notRequired()

export const createTicketSchema = yup.object({
   type: yup
      .string()
      .default("")
      .required(fa.tickets.validation.requiredType)
      .oneOf([...TICKET_TYPES], fa.tickets.validation.invalidType),
   categoryId: yup
      .string()
      .trim()
      .default("")
      .required(fa.tickets.validation.requiredCategory)
      .matches(UUID_RE, fa.tickets.validation.invalidCategory),
   priority: yup
      .string()
      .default("MEDIUM")
      .required(fa.tickets.validation.requiredPriority)
      .oneOf([...TICKET_PRIORITIES], fa.tickets.validation.invalidPriority),
   subject: yup
      .string()
      .trim()
      .default("")
      .required(fa.tickets.validation.requiredSubject)
      .min(5, fa.tickets.validation.subjectShort)
      .max(150, fa.tickets.validation.subjectLong),
   description: yup
      .string()
      .trim()
      .default("")
      .required(fa.tickets.validation.requiredDescription)
      .min(10, fa.tickets.validation.descriptionShort)
      .max(5000, fa.tickets.validation.descriptionLong),
})

export const employeeUpdateTicketSchema = yup.object({
   type: yup.string().notRequired().oneOf([...TICKET_TYPES], fa.tickets.validation.invalidType),
   subject: yup
      .string()
      .trim()
      .notRequired()
      .min(5, fa.tickets.validation.subjectShort)
      .max(150, fa.tickets.validation.subjectLong),
   description: yup
      .string()
      .trim()
      .notRequired()
      .min(10, fa.tickets.validation.descriptionShort)
      .max(5000, fa.tickets.validation.descriptionLong),
})

export const adminUpdateTicketSchema = yup.object({
   type: yup.string().notRequired().oneOf([...TICKET_TYPES], fa.tickets.validation.invalidType),
   subject: yup
      .string()
      .trim()
      .notRequired()
      .min(5, fa.tickets.validation.subjectShort)
      .max(150, fa.tickets.validation.subjectLong),
   description: yup
      .string()
      .trim()
      .notRequired()
      .min(10, fa.tickets.validation.descriptionShort)
      .max(5000, fa.tickets.validation.descriptionLong),
   priority: yup.string().notRequired().oneOf([...TICKET_PRIORITIES], fa.tickets.validation.invalidPriority),
   categoryId: yup.string().trim().notRequired().matches(UUID_RE, fa.tickets.validation.invalidCategory),
})

export const commentSchema = yup.object({
   body: yup
      .string()
      .trim()
      .default("")
      .required(fa.tickets.validation.requiredBody)
      .max(5000, fa.tickets.validation.bodyLong),
})

export const adminCommentSchema = commentSchema.concat(
   yup.object({
      visibility: yup
         .string()
         .default("PUBLIC")
         .oneOf([...TICKET_VISIBILITIES], fa.tickets.validation.invalidVisibility),
   }),
)

export const assignTicketSchema = yup.object({
   assigneeId: yup
      .string()
      .trim()
      .default("")
      .required(fa.tickets.validation.requiredAssignee)
      .matches(UUID_RE, fa.tickets.validation.invalidAssignee),
})

export const employeeStatusSchema = yup.object({
   status: yup
      .string()
      .default("")
      .required(fa.tickets.validation.requiredStatus)
      .oneOf([...EMPLOYEE_STATUS_TARGETS], fa.tickets.validation.invalidStatus),
   note: optionalText(2000, fa.tickets.validation.noteLong).default(""),
})

export const adminStatusSchema = yup.object({
   status: yup
      .string()
      .default("")
      .required(fa.tickets.validation.requiredStatus)
      .oneOf([...ADMIN_STATUS_TARGETS], fa.tickets.validation.invalidStatus),
   note: optionalText(2000, fa.tickets.validation.noteLong).default(""),
   resolutionNote: optionalText(2000, fa.tickets.validation.resolutionNoteLong).default(""),
})

export const createTicketCategorySchema = yup.object({
   name: yup
      .string()
      .trim()
      .default("")
      .required(fa.tickets.validation.invalidCategoryName)
      .min(2, fa.tickets.validation.categoryNameShort)
      .max(80, fa.tickets.validation.categoryNameLong),
   description: optionalText(500, fa.tickets.validation.categoryDescriptionLong).default(""),
   sortOrder: yup
      .number()
      .default(0)
      .integer(fa.tickets.validation.invalidSortOrder)
      .min(0, fa.tickets.validation.invalidSortOrder)
      .max(1_000_000, fa.tickets.validation.invalidSortOrder)
      .typeError(fa.tickets.validation.invalidSortOrder),
   isActive: yup.boolean().default(true),
})

export const updateTicketCategorySchema = yup.object({
   name: yup
      .string()
      .trim()
      .notRequired()
      .min(2, fa.tickets.validation.categoryNameShort)
      .max(80, fa.tickets.validation.categoryNameLong),
   description: optionalText(500, fa.tickets.validation.categoryDescriptionLong),
   sortOrder: yup
      .number()
      .notRequired()
      .integer(fa.tickets.validation.invalidSortOrder)
      .min(0, fa.tickets.validation.invalidSortOrder)
      .max(1_000_000, fa.tickets.validation.invalidSortOrder)
      .typeError(fa.tickets.validation.invalidSortOrder),
   isActive: yup.boolean().notRequired(),
})

export type CreateTicketInput = yup.InferType<typeof createTicketSchema>
export type EmployeeUpdateTicketInput = yup.InferType<typeof employeeUpdateTicketSchema>
export type AdminUpdateTicketInput = yup.InferType<typeof adminUpdateTicketSchema>
export type CommentInput = yup.InferType<typeof commentSchema>
export type AdminCommentInput = yup.InferType<typeof adminCommentSchema>
export type AssignTicketInput = yup.InferType<typeof assignTicketSchema>
export type EmployeeStatusInput = yup.InferType<typeof employeeStatusSchema>
export type AdminStatusInput = yup.InferType<typeof adminStatusSchema>
export type CreateTicketCategoryInput = yup.InferType<typeof createTicketCategorySchema>
export type UpdateTicketCategoryInput = yup.InferType<typeof updateTicketCategorySchema>
