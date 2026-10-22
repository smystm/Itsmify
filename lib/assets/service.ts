import "server-only"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import type { SessionUser } from "@/lib/auth/session"
import { OrganizationInputError, resolveOrgUnitAndLocation } from "@/lib/organization/service"
import { fa } from "@/lib/i18n/fa"
import {
   CATEGORY_BY_TYPE,
   UUID_RE,
   type AssetCategoryValue,
   type AssetTypeValue,
   type CreateAssetInput,
   type UpdateAssetInput,
} from "./validation"
import type {
   AssetAssignmentDto,
   AssetAssignmentSummaryDto,
   AssetCategory,
   AssetComponentDto,
   AssetCreateResult,
   AssetDetailDto,
   AssetEmployeeDto,
   AssetInspectionDto,
   AssetListParams,
   AssetListResponse,
   AssetMaintenanceDto,
   AssetOperationDto,
   AssetOptionDto,
   AssetStatsDto,
   AssetStatus,
   AssetSummaryDto,
   AssetType,
   ComputerDetailDto,
   MonitorDetailDto,
   NetworkDetailDto,
   PeripheralDetailDto,
   SoftwareDetailDto,
} from "./types"

/* -------------------------------------------------------------------------- */
/* Projections and mappers                                                     */
/* -------------------------------------------------------------------------- */

const assignmentEmployeeSelect = {
   id: true,
   user: {
      select: { id: true, firstName: true, lastName: true, username: true, phone: true },
   },
   orgUnit: { select: { id: true, name: true } },
   location: { select: { id: true, floor: true, roomNumber: true } },
} as const satisfies Prisma.EmployeeProfileSelect

export const assetSummarySelect = {
   id: true,
   assetCode: true,
   name: true,
   category: true,
   type: true,
   status: true,
   brand: true,
   model: true,
   serialNumber: true,
   createdAt: true,
   updatedAt: true,
   orgUnit: { select: { id: true, name: true } },
   location: { select: { id: true, floor: true, roomNumber: true } },
   assignments: {
      where: { returnedAt: null },
      orderBy: { assignedAt: "desc" },
      take: 1,
      select: {
         id: true,
         assignedAt: true,
         employee: { select: assignmentEmployeeSelect },
      },
   },
} as const satisfies Prisma.AssetSelect

const assetDetailInclude = {
   orgUnit: { select: { id: true, name: true } },
   location: { select: { id: true, floor: true, roomNumber: true } },
   parentAsset: { select: { id: true, assetCode: true, name: true, type: true } },
   computerDetail: true,
   monitorDetail: true,
   peripheralDetail: true,
   networkDetail: true,
   softwareDetail: true,
   assignments: {
      orderBy: { assignedAt: "desc" },
      include: {
         employee: { select: assignmentEmployeeSelect },
         assignedBy: { select: { id: true, firstName: true, lastName: true } },
      },
   },
   components: {
      where: { deletedAt: null },
      orderBy: { assetCode: "asc" },
      select: { id: true, assetCode: true, name: true, type: true, status: true, serialNumber: true },
   },
   maintenanceRecords: {
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { performedBy: { select: { firstName: true, lastName: true } } },
   },
   operations: {
      orderBy: { performedAt: "desc" },
      take: 25,
      include: { employee: { select: { user: { select: { firstName: true, lastName: true } } } } },
   },
   inspections: {
      orderBy: { visitedAt: "desc" },
      take: 25,
   },
} as const satisfies Prisma.AssetInclude

type AssetDetailRow = Prisma.AssetGetPayload<{ include: typeof assetDetailInclude }>

type AssignmentSummarySource = {
   id: string
   assignedAt: Date
   employee: {
      id: string
      user: { id: string; firstName: string; lastName: string; username: string; phone: string | null }
      orgUnit: { id: string; name: string } | null
      location: { id: string; floor: string; roomNumber: string } | null
   }
}

type AssetSummarySource = {
   id: string
   assetCode: string
   name: string
   category: AssetCategory
   type: AssetType
   status: AssetStatus
   brand: string | null
   model: string | null
   serialNumber: string | null
   createdAt: Date
   updatedAt: Date
   orgUnit: { id: string; name: string } | null
   location: { id: string; floor: string; roomNumber: string } | null
   assignments: AssignmentSummarySource[]
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

function numberOrNull(value: Prisma.Decimal | number | null | undefined): number | null {
   if (value === null || value === undefined) return null
   return Number(value)
}

function mapAssignmentEmployee(employee: AssignmentSummarySource["employee"]): AssetEmployeeDto {
   return {
      id: employee.user.id,
      profileId: employee.id,
      firstName: employee.user.firstName,
      lastName: employee.user.lastName,
      username: employee.user.username,
      phone: employee.user.phone,
      orgUnit: employee.orgUnit,
      location: employee.location,
   }
}

function mapAssignmentSummary(assignment: AssignmentSummarySource): AssetAssignmentSummaryDto {
   return {
      id: assignment.id,
      assignedAt: assignment.assignedAt.toISOString(),
      employee: mapAssignmentEmployee(assignment.employee),
   }
}

function mapAssetSummary(row: AssetSummarySource): AssetSummaryDto {
   return {
      id: row.id,
      assetCode: row.assetCode,
      name: row.name,
      category: row.category,
      type: row.type,
      status: row.status,
      brand: row.brand,
      model: row.model,
      serialNumber: row.serialNumber,
      orgUnit: row.orgUnit,
      location: row.location,
      currentAssignment: row.assignments[0] ? mapAssignmentSummary(row.assignments[0]) : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
   }
}

function mapComputer(detail: NonNullable<AssetDetailRow["computerDetail"]>): ComputerDetailDto {
   return {
      systemType: detail.systemType,
      motherboardBrand: detail.motherboardBrand,
      motherboardModel: detail.motherboardModel,
      cpuTier: detail.cpuTier,
      cpuModel: detail.cpuModel,
      ramAmountGb: detail.ramAmountGb,
      ramType: detail.ramType,
      storageInfo: detail.storageInfo,
      gpuType: detail.gpuType,
      gpuBrand: detail.gpuBrand,
      gpuModel: detail.gpuModel,
      gpuMemoryMb: detail.gpuMemoryMb,
      caseBrand: detail.caseBrand,
      caseModel: detail.caseModel,
      psuBrand: detail.psuBrand,
      psuModel: detail.psuModel,
      hasDvdWriter: detail.hasDvdWriter,
      hasSeparateSpeaker: detail.hasSeparateSpeaker,
      speakerType: detail.speakerType,
      monitorInfo: detail.monitorInfo,
      osName: detail.osName,
      osEdition: detail.osEdition,
      osVersion: detail.osVersion,
      osInstalledOn: iso(detail.osInstalledOn),
      osBuild: detail.osBuild,
      officeVersion: detail.officeVersion,
      systemUsername: detail.systemUsername,
      automationUsername: detail.automationUsername,
   }
}

function mapMonitor(detail: NonNullable<AssetDetailRow["monitorDetail"]>): MonitorDetailDto {
   return {
      sizeInches: numberOrNull(detail.sizeInches),
      panelType: detail.panelType,
      resolution: detail.resolution,
   }
}

function mapPeripheral(detail: NonNullable<AssetDetailRow["peripheralDetail"]>): PeripheralDetailDto {
   return {
      connectionType: detail.connectionType,
      printerType: detail.printerType,
      cartridgeModel: detail.cartridgeModel,
      speakerType: detail.speakerType,
   }
}

function mapNetwork(detail: NonNullable<AssetDetailRow["networkDetail"]>): NetworkDetailDto {
   return {
      ipAddress: detail.ipAddress,
      netboxTitle: detail.netboxTitle,
      hostname: detail.hostname,
      macAddress: detail.macAddress,
      networkType: detail.networkType,
      port: detail.port,
   }
}

function mapSoftware(detail: NonNullable<AssetDetailRow["softwareDetail"]>): SoftwareDetailDto {
   return {
      vendor: detail.vendor,
      version: detail.version,
      edition: detail.edition,
      licenseType: detail.licenseType,
      seatCount: detail.seatCount,
      licenseExpiry: iso(detail.licenseExpiry),
      installedOn: iso(detail.installedOn),
   }
}

function mapAssetDetail(row: AssetDetailRow): AssetDetailDto {
   const assignments: AssetAssignmentDto[] = row.assignments.map((assignment) => ({
      ...mapAssignmentSummary(assignment),
      returnedAt: iso(assignment.returnedAt),
      note: assignment.note,
      returnNote: assignment.returnNote,
      assignedBy: assignment.assignedBy,
   }))

   const components: AssetComponentDto[] = row.components.map((component) => ({
      id: component.id,
      assetCode: component.assetCode,
      name: component.name,
      type: component.type,
      status: component.status,
      serialNumber: component.serialNumber,
   }))

   const maintenance: AssetMaintenanceDto[] = row.maintenanceRecords.map((record) => ({
      id: record.id,
      type: record.type,
      status: record.status,
      title: record.title,
      description: record.description,
      scheduledFor: iso(record.scheduledFor),
      completedAt: iso(record.completedAt),
      cost: numberOrNull(record.cost),
      vendor: record.vendor,
      performedByName: record.performedBy
         ? `${record.performedBy.firstName} ${record.performedBy.lastName}`
         : null,
      createdAt: record.createdAt.toISOString(),
   }))

   const operations: AssetOperationDto[] = row.operations.map((operation) => ({
      id: operation.id,
      operationType: operation.operationType,
      performedAt: operation.performedAt.toISOString(),
      description: operation.description,
      employeeName: operation.employee
         ? `${operation.employee.user.firstName} ${operation.employee.user.lastName}`
         : null,
   }))

   const inspections: AssetInspectionDto[] = row.inspections.map((inspection) => ({
      id: inspection.id,
      visitedAt: inspection.visitedAt.toISOString(),
      visitType: inspection.visitType,
      healthPercent: inspection.healthPercent,
      daysOfOperation: inspection.daysOfOperation,
      temperature: numberOrNull(inspection.temperature),
      description: inspection.description,
   }))

   return {
      ...mapAssetSummary({
         ...row,
         assignments: row.assignments.filter((assignment) => assignment.returnedAt === null),
      } as AssetSummarySource),
      notes: row.notes,
      parentAsset: row.parentAsset,
      computer: row.computerDetail ? mapComputer(row.computerDetail) : null,
      monitor: row.monitorDetail ? mapMonitor(row.monitorDetail) : null,
      peripheral: row.peripheralDetail ? mapPeripheral(row.peripheralDetail) : null,
      network: row.networkDetail ? mapNetwork(row.networkDetail) : null,
      software: row.softwareDetail ? mapSoftware(row.softwareDetail) : null,
      assignments,
      components,
      maintenance,
      operations,
      inspections,
   }
}

/* -------------------------------------------------------------------------- */
/* Errors and validation helpers                                               */
/* -------------------------------------------------------------------------- */

export class AssetServiceError extends Error {
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
      this.name = "AssetServiceError"
      this.code = code
      this.status = status
      this.fields = options?.fields
      this.details = options?.details
   }
}

export function assetErrorResponse(err: unknown): Response {
   if (err instanceof AssetServiceError) {
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
      return Response.json(
         { error: "duplicate", fields: { assetCode: fa.assets.form.assetCodeTaken } },
         { status: 422 },
      )
   }
   console.error("[assets] unexpected error", err)
   return Response.json({ error: "internal" }, { status: 500 })
}

function assertCategory(type: string, category: string): void {
   const expected = CATEGORY_BY_TYPE[type as AssetTypeValue]
   if (!expected || expected !== category) {
      throw new AssetServiceError("invalid_category", 422, {
         fields: { type: fa.assets.form.invalidTypeCategory },
      })
   }
}

async function resolveAssetLinks(
   tx: Prisma.TransactionClient,
   input: { orgUnitName: string; floor: string; roomNumber: string },
): Promise<{ orgUnitId: string | null; locationId: string | null }> {
   try {
      return await resolveOrgUnitAndLocation(tx, input)
   } catch (err) {
      if (err instanceof OrganizationInputError) {
         throw new AssetServiceError("validation", 422, { fields: err.fields })
      }
      throw err
   }
}

async function assertParentAvailable(
   tx: Prisma.TransactionClient,
   parentAssetId: string,
   currentAssetId?: string,
): Promise<string | null> {
   if (!parentAssetId) return null
   if (currentAssetId && parentAssetId === currentAssetId) {
      throw new AssetServiceError("validation", 422, { fields: { parentAssetId: fa.assets.form.invalidParent } })
   }
   const parent = await tx.asset.findFirst({
      where: { id: parentAssetId, deletedAt: null },
      select: { id: true },
   })
   if (!parent) {
      throw new AssetServiceError("validation", 422, { fields: { parentAssetId: fa.assets.form.invalidParent } })
   }
   return parent.id
}

async function assertEmployeeAvailable(
   tx: Prisma.TransactionClient,
   profileId: string,
): Promise<void> {
   const profile = await tx.employeeProfile.findUnique({
      where: { id: profileId },
      select: { id: true, user: { select: { status: true, deletedAt: true } } },
   })
   if (!profile || profile.user.deletedAt || profile.user.status !== "ACTIVE") {
      throw new AssetServiceError("validation", 422, {
         fields: { assignedToEmployeeId: fa.assets.assign.invalidEmployee },
      })
   }
}

/* -------------------------------------------------------------------------- */
/* Detail payload builders                                                     */
/* -------------------------------------------------------------------------- */

function computerData(value: NonNullable<CreateAssetInput["computer"]>) {
   return {
      systemType: nullable(value.systemType),
      motherboardBrand: nullable(value.motherboardBrand),
      motherboardModel: nullable(value.motherboardModel),
      cpuTier: nullable(value.cpuTier),
      cpuModel: nullable(value.cpuModel),
      ramAmountGb: value.ramAmountGb ?? null,
      ramType: nullable(value.ramType),
      storageInfo: nullable(value.storageInfo),
      gpuType: nullable(value.gpuType),
      gpuBrand: nullable(value.gpuBrand),
      gpuModel: nullable(value.gpuModel),
      gpuMemoryMb: value.gpuMemoryMb ?? null,
      caseBrand: nullable(value.caseBrand),
      caseModel: nullable(value.caseModel),
      psuBrand: nullable(value.psuBrand),
      psuModel: nullable(value.psuModel),
      hasDvdWriter: value.hasDvdWriter ?? null,
      hasSeparateSpeaker: value.hasSeparateSpeaker ?? null,
      speakerType: nullable(value.speakerType),
      monitorInfo: nullable(value.monitorInfo),
      osName: nullable(value.osName),
      osEdition: nullable(value.osEdition),
      osVersion: nullable(value.osVersion),
      osInstalledOn: parseDate(value.osInstalledOn),
      osBuild: nullable(value.osBuild),
      officeVersion: nullable(value.officeVersion),
      systemUsername: nullable(value.systemUsername),
      automationUsername: nullable(value.automationUsername),
   }
}

function monitorData(value: NonNullable<CreateAssetInput["monitor"]>) {
   return {
      sizeInches: value.sizeInches ?? null,
      panelType: nullable(value.panelType),
      resolution: nullable(value.resolution),
   }
}

function peripheralData(value: NonNullable<CreateAssetInput["peripheral"]>) {
   return {
      connectionType: nullable(value.connectionType),
      printerType: nullable(value.printerType),
      cartridgeModel: nullable(value.cartridgeModel),
      speakerType: nullable(value.speakerType),
   }
}

function networkData(value: NonNullable<CreateAssetInput["network"]>) {
   return {
      ipAddress: nullable(value.ipAddress),
      netboxTitle: nullable(value.netboxTitle),
      hostname: nullable(value.hostname),
      macAddress: nullable(value.macAddress),
      networkType: nullable(value.networkType),
      port: nullable(value.port),
   }
}

function softwareData(value: NonNullable<CreateAssetInput["software"]>) {
   return {
      vendor: nullable(value.vendor),
      version: nullable(value.version),
      edition: nullable(value.edition),
      licenseType: nullable(value.licenseType),
      seatCount: value.seatCount ?? null,
      licenseExpiry: parseDate(value.licenseExpiry),
      installedOn: parseDate(value.installedOn),
   }
}

function detailRelationsCreate(
   input: CreateAssetInput,
): Pick<Prisma.AssetCreateInput, "computerDetail" | "monitorDetail" | "peripheralDetail" | "networkDetail" | "softwareDetail"> {
   switch (input.type) {
      case "COMPUTER":
         return input.computer ? { computerDetail: { create: computerData(input.computer) } } : {}
      case "MONITOR":
         return input.monitor ? { monitorDetail: { create: monitorData(input.monitor) } } : {}
      case "PRINTER":
      case "SCANNER":
      case "COPIER":
      case "KEYBOARD":
      case "MOUSE":
      case "SPEAKER":
      case "OTHER_HARDWARE":
      case "PROJECTOR":
         return input.peripheral ? { peripheralDetail: { create: peripheralData(input.peripheral) } } : {}
      case "NETWORK_DEVICE":
         return input.network ? { networkDetail: { create: networkData(input.network) } } : {}
      case "SOFTWARE":
         return input.software ? { softwareDetail: { create: softwareData(input.software) } } : {}
      default:
         return {}
   }
}

async function replaceDetails(
   tx: Prisma.TransactionClient,
   assetId: string,
   input: UpdateAssetInput,
): Promise<void> {
   await tx.computerDetail.deleteMany({ where: { assetId } })
   await tx.monitorDetail.deleteMany({ where: { assetId } })
   await tx.peripheralDetail.deleteMany({ where: { assetId } })
   await tx.networkDetail.deleteMany({ where: { assetId } })
   await tx.softwareDetail.deleteMany({ where: { assetId } })

   switch (input.type) {
      case "COMPUTER":
         if (input.computer) await tx.computerDetail.create({ data: { assetId, ...computerData(input.computer) } })
         break
      case "MONITOR":
         if (input.monitor) await tx.monitorDetail.create({ data: { assetId, ...monitorData(input.monitor) } })
         break
      case "PRINTER":
      case "SCANNER":
      case "COPIER":
      case "KEYBOARD":
      case "MOUSE":
      case "SPEAKER":
      case "OTHER_HARDWARE":
      case "PROJECTOR":
         if (input.peripheral) {
            await tx.peripheralDetail.create({ data: { assetId, ...peripheralData(input.peripheral) } })
         }
         break
      case "NETWORK_DEVICE":
         if (input.network) await tx.networkDetail.create({ data: { assetId, ...networkData(input.network) } })
         break
      case "SOFTWARE":
         if (input.software) await tx.softwareDetail.create({ data: { assetId, ...softwareData(input.software) } })
         break
   }
}

/* -------------------------------------------------------------------------- */
/* Service                                                                     */
/* -------------------------------------------------------------------------- */

export async function listAssets(params: AssetListParams): Promise<AssetListResponse> {
   const page = Math.max(1, Number.isFinite(params.page) ? Math.trunc(params.page ?? 1) : 1)
   const pageSize = Math.min(100, Math.max(1, Number.isFinite(params.pageSize) ? Math.trunc(params.pageSize ?? 20) : 20))
   const q = params.q?.trim() ?? ""
   const category = (["HARDWARE", "SOFTWARE", "NETWORK"] as string[]).includes(params.category ?? "")
      ? (params.category as AssetCategoryValue)
      : undefined
   const type = (Object.keys(CATEGORY_BY_TYPE) as string[]).includes(params.type ?? "")
      ? (params.type as AssetTypeValue)
      : undefined
   const status = (["ACTIVE", "IN_STORAGE", "IN_REPAIR", "RETIRED", "LOST"] as string[]).includes(params.status ?? "")
      ? (params.status as "ACTIVE" | "IN_STORAGE" | "IN_REPAIR" | "RETIRED" | "LOST")
      : undefined

   const assignmentFilter: Prisma.AssetAssignmentListRelationFilter | undefined = params.employeeId
      ? { some: { employeeId: params.employeeId, returnedAt: null } }
      : params.assigned === "assigned"
        ? { some: { returnedAt: null } }
        : params.assigned === "unassigned"
          ? { none: { returnedAt: null } }
          : undefined

   const where: Prisma.AssetWhereInput = {
      deletedAt: null,
      ...(category ? { category } : {}),
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(assignmentFilter ? { assignments: assignmentFilter } : {}),
      ...(q
         ? {
              OR: [
                 { assetCode: { contains: q, mode: "insensitive" } },
                 { name: { contains: q, mode: "insensitive" } },
                 { brand: { contains: q, mode: "insensitive" } },
                 { model: { contains: q, mode: "insensitive" } },
                 { serialNumber: { contains: q, mode: "insensitive" } },
              ],
           }
         : {}),
   }

   let orderBy: Prisma.AssetOrderByWithRelationInput
   switch (params.sort) {
      case "oldest":
         orderBy = { createdAt: "asc" }
         break
      case "name":
         orderBy = { name: "asc" }
         break
      case "code":
         orderBy = { assetCode: "asc" }
         break
      default:
         orderBy = { createdAt: "desc" }
   }

   const [rows, total] = await Promise.all([
      prisma.asset.findMany({
         where,
         orderBy,
         skip: (page - 1) * pageSize,
         take: pageSize,
         select: assetSummarySelect,
      }),
      prisma.asset.count({ where }),
   ])

   return {
      assets: rows.map(mapAssetSummary),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
   }
}

export async function getAssetDetail(id: string): Promise<AssetDetailDto | null> {
   if (!UUID_RE.test(id)) return null
   const row = await prisma.asset.findFirst({
      where: { id, deletedAt: null },
      include: assetDetailInclude,
   })
   return row ? mapAssetDetail(row) : null
}

export async function createAsset(input: CreateAssetInput, actor: SessionUser): Promise<AssetCreateResult> {
   assertCategory(input.type, input.category)
   if (input.assignedToEmployeeId && (input.status === "RETIRED" || input.status === "LOST")) {
      throw new AssetServiceError("validation", 422, {
         fields: { assignedToEmployeeId: fa.assets.assign.cannotAssignUnavailable },
      })
   }

   const asset = await prisma.$transaction(async (tx) => {
      const links = await resolveAssetLinks(tx, input)
      const parentAssetId = await assertParentAvailable(tx, input.parentAssetId)
      const assetCode = input.assetCode.trim()

      const created = await tx.asset.create({
         data: {
            ...(assetCode ? { assetCode } : {}),
            name: input.name.trim(),
            category: input.category as AssetCategoryValue,
            type: input.type as AssetTypeValue,
            status: input.status as "ACTIVE" | "IN_STORAGE" | "IN_REPAIR" | "RETIRED" | "LOST",
            brand: nullable(input.brand),
            model: nullable(input.model),
            serialNumber: nullable(input.serialNumber),
            notes: nullable(input.notes),
            orgUnit: links.orgUnitId ? { connect: { id: links.orgUnitId } } : undefined,
            location: links.locationId ? { connect: { id: links.locationId } } : undefined,
            parentAsset: parentAssetId ? { connect: { id: parentAssetId } } : undefined,
            createdBy: { connect: { id: actor.id } },
            ...detailRelationsCreate(input),
         },
         select: { id: true },
      })

      if (input.assignedToEmployeeId) {
         await assertEmployeeAvailable(tx, input.assignedToEmployeeId)
         await tx.assetAssignment.create({
            data: {
               assetId: created.id,
               employeeId: input.assignedToEmployeeId,
               assignedById: actor.id,
               note: nullable(input.assignNote),
            },
         })
      }

      return tx.asset.findUniqueOrThrow({
         where: { id: created.id },
         include: assetDetailInclude,
      })
   })

   return { asset: mapAssetDetail(asset) }
}

export async function updateAsset(id: string, input: UpdateAssetInput, actor: SessionUser): Promise<AssetDetailDto> {
   if (!UUID_RE.test(id)) throw new AssetServiceError("not_found", 404)
   assertCategory(input.type, input.category)
   const existing = await prisma.asset.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, assetCode: true },
   })
   if (!existing) throw new AssetServiceError("not_found", 404)

   const updated = await prisma.$transaction(async (tx) => {
      const links = await resolveAssetLinks(tx, input)
      const parentAssetId = await assertParentAvailable(tx, input.parentAssetId, id)
      const assetCode = input.assetCode.trim()

      await tx.asset.update({
         where: { id },
         data: {
            ...(assetCode ? { assetCode } : {}),
            name: input.name.trim(),
            category: input.category as AssetCategoryValue,
            type: input.type as AssetTypeValue,
            status: input.status as "ACTIVE" | "IN_STORAGE" | "IN_REPAIR" | "RETIRED" | "LOST",
            brand: nullable(input.brand),
            model: nullable(input.model),
            serialNumber: nullable(input.serialNumber),
            notes: nullable(input.notes),
            orgUnit: links.orgUnitId ? { connect: { id: links.orgUnitId } } : { disconnect: true },
            location: links.locationId ? { connect: { id: links.locationId } } : { disconnect: true },
            parentAsset: parentAssetId ? { connect: { id: parentAssetId } } : { disconnect: true },
         },
      })

      await replaceDetails(tx, id, input)

      return tx.asset.findUniqueOrThrow({
         where: { id },
         include: assetDetailInclude,
      })
   })

   // Actor is accepted here for symmetry with create/assign and to make the
   // audit seam obvious; asset mutation history currently lives in assignment
   // rows and the operation/maintenance tables.
   void actor

   return mapAssetDetail(updated)
}

export async function assignAsset(
   assetId: string,
   employeeId: string,
   note: string | null,
   actor: SessionUser,
): Promise<AssetDetailDto> {
   if (!UUID_RE.test(assetId)) throw new AssetServiceError("not_found", 404)
   const asset = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "assets" WHERE "id" = ${assetId}::uuid FOR UPDATE`
      const target = await tx.asset.findFirst({
         where: { id: assetId, deletedAt: null },
         select: { id: true, status: true },
      })
      if (!target) throw new AssetServiceError("not_found", 404)
      if (target.status === "RETIRED" || target.status === "LOST") {
         throw new AssetServiceError("asset_unavailable", 409, {
            fields: { assignedToEmployeeId: fa.assets.assign.cannotAssignUnavailable },
         })
      }

      await assertEmployeeAvailable(tx, employeeId)

      const current = await tx.assetAssignment.findFirst({
         where: { assetId, returnedAt: null },
         orderBy: { assignedAt: "desc" },
         select: { id: true, employeeId: true },
      })
      if (current?.employeeId === employeeId) {
         throw new AssetServiceError("already_assigned", 409)
      }

      const now = new Date()
      if (current) {
         await tx.assetAssignment.update({
            where: { id: current.id },
            data: { returnedAt: now, returnNote: fa.assets.assign.reassignedNote },
         })
      }

      await tx.assetAssignment.create({
         data: {
            assetId,
            employeeId,
            assignedById: actor.id,
            note: nullable(note),
         },
      })

      if (target.status === "IN_STORAGE") {
         await tx.asset.update({ where: { id: assetId }, data: { status: "ACTIVE" } })
      }

      return tx.asset.findUniqueOrThrow({
         where: { id: assetId },
         include: assetDetailInclude,
      })
   })

   return mapAssetDetail(asset)
}

export async function returnAsset(
   assetId: string,
   note: string | null,
   actor: SessionUser,
): Promise<AssetDetailDto> {
   if (!UUID_RE.test(assetId)) throw new AssetServiceError("not_found", 404)
   const asset = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "assets" WHERE "id" = ${assetId}::uuid FOR UPDATE`
      const target = await tx.asset.findFirst({
         where: { id: assetId, deletedAt: null },
         select: { id: true, status: true },
      })
      if (!target) throw new AssetServiceError("not_found", 404)

      const current = await tx.assetAssignment.findFirst({
         where: { assetId, returnedAt: null },
         orderBy: { assignedAt: "desc" },
         select: { id: true },
      })
      if (!current) throw new AssetServiceError("not_assigned", 409)

      await tx.assetAssignment.update({
         where: { id: current.id },
         data: { returnedAt: new Date(), returnNote: nullable(note) },
      })

      if (target.status === "ACTIVE") {
         await tx.asset.update({ where: { id: assetId }, data: { status: "IN_STORAGE" } })
      }

      void actor

      return tx.asset.findUniqueOrThrow({
         where: { id: assetId },
         include: assetDetailInclude,
      })
   })

   return mapAssetDetail(asset)
}

export async function deleteAsset(id: string, actor: SessionUser): Promise<void> {
   if (!UUID_RE.test(id)) throw new AssetServiceError("not_found", 404)
   const asset = await prisma.asset.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
   })
   if (!asset) throw new AssetServiceError("not_found", 404)

   const active = await prisma.assetAssignment.count({ where: { assetId: id, returnedAt: null } })
   if (active > 0) {
      throw new AssetServiceError("asset_assigned", 409, { details: { count: active } })
   }

   await prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date(), deletedById: actor.id, status: "RETIRED" },
   })
}

export async function getAssetStats(): Promise<AssetStatsDto> {
   const [total, assigned, inRepair, byCategoryRows, byStatusRows] = await Promise.all([
      prisma.asset.count({ where: { deletedAt: null } }),
      prisma.asset.count({ where: { deletedAt: null, assignments: { some: { returnedAt: null } } } }),
      prisma.asset.count({ where: { deletedAt: null, status: "IN_REPAIR" } }),
      prisma.asset.groupBy({
         by: ["category"],
         where: { deletedAt: null },
         _count: { _all: true },
      }),
      prisma.asset.groupBy({
         by: ["status"],
         where: { deletedAt: null },
         _count: { _all: true },
      }),
   ])

   return {
      total,
      assigned,
      unassigned: Math.max(0, total - assigned),
      inRepair,
      byCategory: byCategoryRows.map((row) => ({
         category: row.category,
         count: row._count._all,
      })),
      byStatus: byStatusRows.map((row) => ({
         status: row.status,
         count: row._count._all,
      })),
   }
}

export async function getRecentAssets(limit = 5): Promise<AssetSummaryDto[]> {
   const rows = await prisma.asset.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: Math.min(20, Math.max(1, limit)),
      select: assetSummarySelect,
   })
   return rows.map(mapAssetSummary)
}

export async function listAssetOptions(query: string, excludeId?: string, limit = 30): Promise<AssetOptionDto[]> {
   const q = query.trim()
   return prisma.asset.findMany({
      where: {
         deletedAt: null,
         ...(excludeId ? { id: { not: excludeId } } : {}),
         ...(q
            ? {
                 OR: [
                    { assetCode: { contains: q, mode: "insensitive" } },
                    { name: { contains: q, mode: "insensitive" } },
                 ],
              }
            : {}),
      },
      orderBy: { assetCode: "asc" },
      take: Math.min(50, Math.max(1, limit)),
      select: { id: true, assetCode: true, name: true, type: true },
   })
}
