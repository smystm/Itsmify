import "server-only"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { generateTemporaryPassword, hashPassword } from "@/lib/auth/password"
import { normalizePhone } from "@/lib/auth/phone"
import { isRole } from "@/lib/auth/permissions"
import type { SessionUser } from "@/lib/auth/session"
import { OrganizationInputError, resolveOrgUnitAndLocation } from "@/lib/organization/service"
import { fa } from "@/lib/i18n/fa"
import type { CreateEmployeeInput, UpdateEmployeeInput } from "./validation"
import type {
   AdminEmployeeDto,
   EmployeeAuditDto,
   EmployeeCreateResult,
   EmployeeDetailDto,
   EmployeeListParams,
   EmployeeListResponse,
   EmployeeLookupDto,
   EmployeeProfileDto,
} from "./types"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Employee service. Route handlers stay thin: authorization is their job,
 * everything that touches more than one row is a transaction here.
 *
 * Identity stays on User (names, username, phone, credentials); HR fields live
 * on EmployeeProfile. The select below is the only projection that carries the
 * password hash, and it is stripped by `toEmployeeDto`.
 */

export const employeeUserSelect = {
   id: true,
   firstName: true,
   lastName: true,
   username: true,
   phone: true,
   role: true,
   status: true,
   phoneVerifiedAt: true,
   mustChangePassword: true,
   lastLoginAt: true,
   createdAt: true,
   updatedAt: true,
   deletedAt: true,
   passwordHash: true,
   employeeProfile: {
      select: {
         id: true,
         personnelCode: true,
         nationalId: true,
         jobTitle: true,
         employmentType: true,
         hireDate: true,
         notes: true,
         createdAt: true,
         updatedAt: true,
         orgUnit: { select: { id: true, name: true } },
         location: { select: { id: true, floor: true, roomNumber: true } },
         _count: {
            select: {
               assignments: { where: { returnedAt: null } },
            },
         },
      },
   },
} as const satisfies Prisma.UserSelect

type EmployeeUserRow = Prisma.UserGetPayload<{ select: typeof employeeUserSelect }>
type EmployeeProfileRow = NonNullable<EmployeeUserRow["employeeProfile"]>

export class EmployeeServiceError extends Error {
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
      this.name = "EmployeeServiceError"
      this.code = code
      this.status = status
      this.fields = options?.fields
      this.details = options?.details
   }
}

function iso(value: Date | null | undefined): string | null {
   return value ? value.toISOString() : null
}

function nullable(value: string | null | undefined): string | null {
   const trimmed = value?.trim()
   return trimmed ? trimmed : null
}

function parseDate(value: string | null | undefined): Date | null {
   const trimmed = value?.trim()
   if (!trimmed) return null
   return new Date(`${trimmed}T00:00:00.000Z`)
}

function mapProfile(profile: EmployeeProfileRow): EmployeeProfileDto {
   return {
      id: profile.id,
      personnelCode: profile.personnelCode,
      nationalId: profile.nationalId,
      jobTitle: profile.jobTitle,
      employmentType: profile.employmentType,
      hireDate: iso(profile.hireDate),
      notes: profile.notes,
      orgUnit: profile.orgUnit,
      location: profile.location,
      activeAssetCount: profile._count.assignments,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
   }
}

export function toEmployeeDto(row: EmployeeUserRow): AdminEmployeeDto {
   const { passwordHash, employeeProfile, ...account } = row
   return {
      ...account,
      phoneVerifiedAt: iso(account.phoneVerifiedAt),
      lastLoginAt: iso(account.lastLoginAt),
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
      deletedAt: iso(account.deletedAt),
      hasPassword: Boolean(passwordHash),
      profile: employeeProfile ? mapProfile(employeeProfile) : null,
   }
}

export function employeeErrorResponse(err: unknown) {
   if (err instanceof EmployeeServiceError) {
      return Response.json(
         {
            error: err.code,
            ...(err.fields ? { fields: err.fields } : {}),
            ...(err.details ? { details: err.details } : {}),
         },
         { status: err.status },
      )
   }
   if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = String(err.meta?.target ?? "")
      const field = target.includes("phone")
         ? "phone"
         : target.includes("username")
           ? "username"
           : target.includes("personnelCode")
             ? "personnelCode"
             : target.includes("nationalId")
               ? "nationalId"
               : "duplicate"
      return Response.json(
         {
            error: "duplicate",
            fields: { [field]: field === "phone" ? fa.admin.phoneTaken : fa.admin.usernameTaken },
         },
         { status: 422 },
      )
   }
   console.error("[employees] unexpected error", err)
   return Response.json({ error: "internal" }, { status: 500 })
}

async function assertUnique(
   tx: Prisma.TransactionClient,
   input: { username: string; phone: string | null; personnelCode: string | null; nationalId: string | null },
   excludeUserId?: string,
): Promise<void> {
   const [byUsername, byPhone, byPersonnelCode, byNationalId] = await Promise.all([
      tx.user.findUnique({ where: { username: input.username }, select: { id: true } }),
      input.phone ? tx.user.findUnique({ where: { phone: input.phone }, select: { id: true } }) : null,
      input.personnelCode
         ? tx.employeeProfile.findFirst({
              where: {
                 personnelCode: input.personnelCode,
                 ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
              },
              select: { userId: true },
           })
         : null,
      input.nationalId
         ? tx.employeeProfile.findFirst({
              where: {
                 nationalId: input.nationalId,
                 ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
              },
              select: { userId: true },
           })
         : null,
   ])

   const fields: Record<string, string> = {}
   if (byUsername && byUsername.id !== excludeUserId) fields.username = fa.admin.usernameTaken
   if (byPhone && byPhone.id !== excludeUserId) fields.phone = fa.admin.phoneTaken
   if (byPersonnelCode && byPersonnelCode.userId !== excludeUserId) {
      fields.personnelCode = fa.employees.personnelCodeTaken
   }
   if (byNationalId && byNationalId.userId !== excludeUserId) {
      fields.nationalId = fa.employees.nationalIdTaken
   }

   if (Object.keys(fields).length > 0) {
      throw new EmployeeServiceError("duplicate", 422, { fields })
   }
}

async function resolveProfileLinks(
   tx: Prisma.TransactionClient,
   input: { orgUnitName: string; floor: string; roomNumber: string },
): Promise<{ orgUnitId: string | null; locationId: string | null }> {
   try {
      return await resolveOrgUnitAndLocation(tx, input)
   } catch (err) {
      if (err instanceof OrganizationInputError) {
         throw new EmployeeServiceError("validation", 422, { fields: err.fields })
      }
      throw err
   }
}

async function assertCanLoseAdmin(target: { id: string; role: string; status: string }): Promise<void> {
   if (target.role !== "SYS_ADMIN" || target.status !== "ACTIVE") return
   const otherAdmins = await prisma.user.count({
      where: {
         id: { not: target.id },
         role: "SYS_ADMIN",
         status: "ACTIVE",
         deletedAt: null,
      },
   })
   if (otherAdmins === 0) {
      throw new EmployeeServiceError("last_admin", 409)
   }
}

export async function listEmployees(params: EmployeeListParams): Promise<EmployeeListResponse> {
   const page = Math.max(1, Number.isFinite(params.page) ? Math.trunc(params.page ?? 1) : 1)
   const pageSize = Math.min(100, Math.max(1, Number.isFinite(params.pageSize) ? Math.trunc(params.pageSize ?? 20) : 20))
   const q = params.q?.trim() ?? ""
   const role = isRole(params.role) ? params.role : undefined
   const status = params.status === "ACTIVE" || params.status === "SUSPENDED" ? params.status : undefined
   const archived = params.archived === true
   const orgUnitId = params.orgUnitId?.trim()

   const where: Prisma.UserWhereInput = {
      deletedAt: archived ? { not: null } : null,
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(orgUnitId ? { employeeProfile: { is: { orgUnitId } } } : {}),
      ...(q
         ? {
              OR: [
                 { firstName: { contains: q, mode: "insensitive" } },
                 { lastName: { contains: q, mode: "insensitive" } },
                 { username: { contains: q, mode: "insensitive" } },
                 { phone: { contains: q } },
                 {
                    employeeProfile: {
                       is: {
                          OR: [
                             { personnelCode: { contains: q, mode: "insensitive" } },
                             { nationalId: { contains: q } },
                             { jobTitle: { contains: q, mode: "insensitive" } },
                          ],
                       },
                    },
                 },
              ],
           }
         : {}),
   }

   let orderBy: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[]
   switch (params.sort) {
      case "oldest":
         orderBy = { createdAt: "asc" }
         break
      case "name":
         orderBy = [{ firstName: "asc" }, { lastName: "asc" }]
         break
      case "lastLogin":
         orderBy = { lastLoginAt: "desc" }
         break
      default:
         orderBy = { createdAt: "desc" }
   }

   const [rows, total] = await Promise.all([
      prisma.user.findMany({
         where,
         orderBy,
         skip: (page - 1) * pageSize,
         take: pageSize,
         select: employeeUserSelect,
      }),
      prisma.user.count({ where }),
   ])

   return {
      employees: rows.map(toEmployeeDto),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
   }
}

export async function getEmployeeDetail(id: string): Promise<EmployeeDetailDto | null> {
   if (!UUID_RE.test(id)) return null
   const row = await prisma.user.findUnique({ where: { id }, select: employeeUserSelect })
   if (!row) return null

   const profileId = row.employeeProfile?.id
   const [assignments, auditRows] = await Promise.all([
      profileId
         ? prisma.assetAssignment.findMany({
              where: { employeeId: profileId, returnedAt: null },
              orderBy: { assignedAt: "desc" },
              select: {
                 id: true,
                 assignedAt: true,
                 note: true,
                 asset: {
                    select: {
                       id: true,
                       assetCode: true,
                       name: true,
                       category: true,
                       type: true,
                       status: true,
                       brand: true,
                       model: true,
                       serialNumber: true,
                    },
                 },
              },
           })
         : Promise.resolve([]),
      prisma.accountAudit.findMany({
         where: { targetUserId: id },
         orderBy: { createdAt: "desc" },
         take: 25,
         select: {
            id: true,
            action: true,
            detail: true,
            createdAt: true,
            actor: { select: { firstName: true, lastName: true } },
         },
      }),
   ])

   const audit: EmployeeAuditDto[] = auditRows.map((item) => ({
      id: item.id,
      action: item.action,
      detail: item.detail,
      createdAt: item.createdAt.toISOString(),
      actorName: item.actor ? `${item.actor.firstName} ${item.actor.lastName}` : null,
   }))

   return {
      ...toEmployeeDto(row),
      assets: assignments.map((assignment) => ({
         assignmentId: assignment.id,
         assignedAt: assignment.assignedAt.toISOString(),
         note: assignment.note,
         asset: assignment.asset,
      })),
      audit,
   }
}

export async function createEmployee(
   input: CreateEmployeeInput,
   actor: SessionUser,
): Promise<EmployeeCreateResult> {
   const phone = input.phone ? normalizePhone(input.phone) : null
   const username = input.username.trim().toLowerCase()
   const personnelCode = nullable(input.personnelCode)
   const nationalId = nullable(input.nationalId)
   const suppliedPassword = input.password.trim().length > 0
   const initialPassword = suppliedPassword ? input.password : generateTemporaryPassword(16)
   const passwordHash = await hashPassword(initialPassword)

   const created = await prisma.$transaction(async (tx) => {
      await assertUnique(tx, { username, phone, personnelCode, nationalId })

      const links = await resolveProfileLinks(tx, input)

      const user = await tx.user.create({
         data: {
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            username,
            phone,
            role: input.role as "EMPLOYEE" | "IT_SPECIALIST" | "IT_MANAGER" | "SYS_ADMIN",
            status: input.status as "ACTIVE" | "SUSPENDED",
            passwordHash,
            mustChangePassword: true,
            phoneVerifiedAt: null,
            employeeProfile: {
               create: {
                  personnelCode,
                  nationalId,
                  jobTitle: nullable(input.jobTitle),
                  employmentType: input.employmentType ? (input.employmentType as "OFFICIAL" | "CONTRACTUAL" | "TEMPORARY" | "OTHER") : null,
                  hireDate: parseDate(input.hireDate),
                  notes: nullable(input.notes),
                  orgUnitId: links.orgUnitId,
                  locationId: links.locationId,
               },
            },
         },
         select: employeeUserSelect,
      })

      await tx.accountAudit.create({
         data: {
            actorId: actor.id,
            targetUserId: user.id,
            action: "CREATED",
            detail: {
               role: user.role,
               status: user.status,
               phoneSet: Boolean(phone),
               passwordGenerated: !suppliedPassword,
               personnelCode,
               orgUnitId: links.orgUnitId,
               locationId: links.locationId,
            },
         },
      })

      return user
   })

   return {
      employee: toEmployeeDto(created),
      initialPassword: suppliedPassword ? undefined : initialPassword,
   }
}

export async function updateEmployee(
   id: string,
   input: UpdateEmployeeInput,
   actor: SessionUser,
): Promise<AdminEmployeeDto> {
   const target = await prisma.user.findUnique({ where: { id }, select: employeeUserSelect })
   if (!target || target.deletedAt) {
      throw new EmployeeServiceError("not_found", 404)
   }

   const role = input.role as "EMPLOYEE" | "IT_SPECIALIST" | "IT_MANAGER" | "SYS_ADMIN"
   const status = input.status as "ACTIVE" | "SUSPENDED"
   const phone = input.phone ? normalizePhone(input.phone) : null
   const username = input.username.trim().toLowerCase()
   const personnelCode = nullable(input.personnelCode)
   const nationalId = nullable(input.nationalId)
   const hireDate = parseDate(input.hireDate)

   const roleChanged = target.role !== role
   const statusChanged = target.status !== status
   const phoneChanged = (target.phone ?? null) !== phone

   if (actor.id === target.id && (roleChanged || statusChanged)) {
      throw new EmployeeServiceError("self_protected", 400)
   }
   if (target.role === "SYS_ADMIN" && target.status === "ACTIVE" && (role !== "SYS_ADMIN" || status !== "ACTIVE")) {
      await assertCanLoseAdmin(target)
   }

   const updated = await prisma.$transaction(async (tx) => {
      await assertUnique(tx, { username, phone, personnelCode, nationalId }, target.id)
      const links = await resolveProfileLinks(tx, input)

      const profile = target.employeeProfile
      const changedFields: string[] = []
      if (target.firstName !== input.firstName.trim()) changedFields.push("firstName")
      if (target.lastName !== input.lastName.trim()) changedFields.push("lastName")
      if (target.username !== username) changedFields.push("username")
      if (phoneChanged) changedFields.push("phone")
      if ((profile?.personnelCode ?? null) !== personnelCode) changedFields.push("personnelCode")
      if ((profile?.nationalId ?? null) !== nationalId) changedFields.push("nationalId")
      if ((profile?.jobTitle ?? null) !== nullable(input.jobTitle)) changedFields.push("jobTitle")
      if ((profile?.employmentType ?? null) !== (input.employmentType || null)) changedFields.push("employmentType")
      if ((profile?.hireDate ?? null)?.getTime() !== hireDate?.getTime()) changedFields.push("hireDate")
      if ((profile?.notes ?? null) !== nullable(input.notes)) changedFields.push("notes")
      if ((profile?.orgUnit?.id ?? null) !== links.orgUnitId) changedFields.push("orgUnit")
      if ((profile?.location?.id ?? null) !== links.locationId) changedFields.push("location")

      const user = await tx.user.update({
         where: { id: target.id },
         data: {
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            username,
            phone,
            role,
            status,
            ...(phoneChanged ? { phoneVerifiedAt: null } : {}),
         },
         select: employeeUserSelect,
      })

      await tx.employeeProfile.upsert({
         where: { userId: target.id },
         update: {
            personnelCode,
            nationalId,
            jobTitle: nullable(input.jobTitle),
            employmentType: input.employmentType
               ? (input.employmentType as "OFFICIAL" | "CONTRACTUAL" | "TEMPORARY" | "OTHER")
               : null,
            hireDate,
            notes: nullable(input.notes),
            orgUnitId: links.orgUnitId,
            locationId: links.locationId,
         },
         create: {
            userId: target.id,
            personnelCode,
            nationalId,
            jobTitle: nullable(input.jobTitle),
            employmentType: input.employmentType
               ? (input.employmentType as "OFFICIAL" | "CONTRACTUAL" | "TEMPORARY" | "OTHER")
               : null,
            hireDate,
            notes: nullable(input.notes),
            orgUnitId: links.orgUnitId,
            locationId: links.locationId,
         },
      })

      if (changedFields.length > 0) {
         await tx.accountAudit.create({
            data: {
               actorId: actor.id,
               targetUserId: target.id,
               action: "UPDATED",
               detail: { fields: changedFields, phoneChanged },
            },
         })
      }
      if (roleChanged) {
         await tx.accountAudit.create({
            data: {
               actorId: actor.id,
               targetUserId: target.id,
               action: "ROLE_CHANGED",
               detail: { from: target.role, to: role },
            },
         })
      }
      if (statusChanged) {
         await tx.accountAudit.create({
            data: {
               actorId: actor.id,
               targetUserId: target.id,
               action: "STATUS_CHANGED",
               detail: { from: target.status, to: status },
            },
         })
      }
      if (roleChanged || statusChanged || phoneChanged) {
         await tx.session.deleteMany({ where: { userId: target.id } })
      }
      if (phoneChanged) {
         await tx.phoneVerification.deleteMany({ where: { userId: target.id, purpose: "PHONE_CHANGE" } })
      }

      return user
   })

   return toEmployeeDto(updated)
}

export async function setEmployeeStatus(
   id: string,
   status: "ACTIVE" | "SUSPENDED",
   actor: SessionUser,
): Promise<AdminEmployeeDto> {
   const target = await prisma.user.findUnique({ where: { id }, select: employeeUserSelect })
   if (!target || target.deletedAt) throw new EmployeeServiceError("not_found", 404)
   if (actor.id === target.id) throw new EmployeeServiceError("self_protected", 400)

   if (target.status === status) return toEmployeeDto(target)
   if (target.role === "SYS_ADMIN" && target.status === "ACTIVE" && status !== "ACTIVE") {
      await assertCanLoseAdmin(target)
   }

   const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
         where: { id },
         data: { status },
         select: employeeUserSelect,
      })
      await tx.session.deleteMany({ where: { userId: id } })
      await tx.accountAudit.create({
         data: {
            actorId: actor.id,
            targetUserId: id,
            action: "STATUS_CHANGED",
            detail: { from: target.status, to: status, via: "quick-status" },
         },
      })
      return user
   })

   return toEmployeeDto(updated)
}

export async function deleteEmployee(id: string, actor: SessionUser): Promise<void> {
   const target = await prisma.user.findUnique({
      where: { id },
      select: {
         id: true,
         role: true,
         status: true,
         deletedAt: true,
         employeeProfile: { select: { id: true } },
      },
   })
   if (!target || target.deletedAt) {
      throw new EmployeeServiceError("not_found", 404)
   }
   if (actor.id === target.id) {
      throw new EmployeeServiceError("self_protected", 400)
   }
   if (target.role === "SYS_ADMIN" && target.status === "ACTIVE") {
      await assertCanLoseAdmin(target)
   }

   if (target.employeeProfile) {
      const activeAssignments = await prisma.assetAssignment.count({
         where: { employeeId: target.employeeProfile.id, returnedAt: null },
      })
      if (activeAssignments > 0) {
         throw new EmployeeServiceError("assets_assigned", 409, {
            details: { count: activeAssignments },
         })
      }
   }

   await prisma.$transaction(async (tx) => {
      await tx.user.update({
         where: { id: target.id },
         data: { deletedAt: new Date(), deletedById: actor.id, status: "SUSPENDED" },
      })
      await tx.session.deleteMany({ where: { userId: target.id } })
      await tx.phoneVerification.deleteMany({ where: { userId: target.id } })
      await tx.accountAudit.create({
         data: {
            actorId: actor.id,
            targetUserId: target.id,
            action: "DELETED",
            detail: { softDelete: true },
         },
      })
   })
}

export async function lookupEmployees(query: string, limit = 20): Promise<EmployeeLookupDto[]> {
   const q = query.trim()
   const take = Math.min(50, Math.max(1, limit))
   const rows = await prisma.user.findMany({
      where: {
         deletedAt: null,
         status: "ACTIVE",
         ...(q
            ? {
                 OR: [
                    { firstName: { contains: q, mode: "insensitive" } },
                    { lastName: { contains: q, mode: "insensitive" } },
                    { username: { contains: q, mode: "insensitive" } },
                    { phone: { contains: q } },
                    {
                       employeeProfile: {
                          is: {
                             OR: [
                                { personnelCode: { contains: q, mode: "insensitive" } },
                                { jobTitle: { contains: q, mode: "insensitive" } },
                             ],
                          },
                       },
                    },
                 ],
              }
            : {}),
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take,
      select: {
         id: true,
         firstName: true,
         lastName: true,
         username: true,
         employeeProfile: {
            select: {
               id: true,
               personnelCode: true,
               orgUnit: { select: { id: true, name: true } },
               location: { select: { id: true, floor: true, roomNumber: true } },
               _count: {
                  select: { assignments: { where: { returnedAt: null } } },
               },
            },
         },
      },
   })

   return rows.flatMap((row) => {
      const profile = row.employeeProfile
      if (!profile) return []
      return [
         {
            id: row.id,
            profileId: profile.id,
            firstName: row.firstName,
            lastName: row.lastName,
            username: row.username,
            personnelCode: profile.personnelCode,
            orgUnit: profile.orgUnit,
            location: profile.location,
            activeAssetCount: profile._count.assignments,
         },
      ]
   })
}

export async function listOrgUnits(): Promise<{ id: string; name: string }[]> {
   return prisma.orgUnit.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
}

export async function getEmployeeStats() {
   const [total, active, suspended, newThisMonth] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      prisma.user.count({ where: { deletedAt: null, status: "SUSPENDED" } }),
      prisma.user.count({
         where: {
            deletedAt: null,
            createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
         },
      }),
   ])
   return { total, active, suspended, newThisMonth }
}
