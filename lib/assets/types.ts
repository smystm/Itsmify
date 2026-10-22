export type AssetCategory = "HARDWARE" | "SOFTWARE" | "NETWORK"
export type AssetType =
   | "COMPUTER"
   | "MONITOR"
   | "PRINTER"
   | "SCANNER"
   | "COPIER"
   | "PROJECTOR"
   | "KEYBOARD"
   | "MOUSE"
   | "SPEAKER"
   | "OTHER_HARDWARE"
   | "SOFTWARE"
   | "NETWORK_DEVICE"
export type AssetStatus = "ACTIVE" | "IN_STORAGE" | "IN_REPAIR" | "RETIRED" | "LOST"

export interface AssetOrgUnitDto {
   id: string
   name: string
}

export interface AssetLocationDto {
   id: string
   floor: string
   roomNumber: string
}

export interface AssetEmployeeDto {
   id: string
   profileId: string
   firstName: string
   lastName: string
   username: string
   phone: string | null
   orgUnit: AssetOrgUnitDto | null
   location: AssetLocationDto | null
}

export interface AssetAssignmentSummaryDto {
   id: string
   assignedAt: string
   employee: AssetEmployeeDto
}

export interface AssetAssignmentDto extends AssetAssignmentSummaryDto {
   returnedAt: string | null
   note: string | null
   returnNote: string | null
   assignedBy: { id: string; firstName: string; lastName: string } | null
}

export interface AssetSummaryDto {
   id: string
   assetCode: string
   name: string
   category: AssetCategory
   type: AssetType
   status: AssetStatus
   brand: string | null
   model: string | null
   serialNumber: string | null
   orgUnit: AssetOrgUnitDto | null
   location: AssetLocationDto | null
   currentAssignment: AssetAssignmentSummaryDto | null
   createdAt: string
   updatedAt: string
}

export interface AssetComponentDto {
   id: string
   assetCode: string
   name: string
   type: AssetType
   status: AssetStatus
   serialNumber: string | null
}

export interface ComputerDetailDto {
   systemType: string | null
   motherboardBrand: string | null
   motherboardModel: string | null
   cpuTier: string | null
   cpuModel: string | null
   ramAmountGb: number | null
   ramType: string | null
   storageInfo: string | null
   gpuType: string | null
   gpuBrand: string | null
   gpuModel: string | null
   gpuMemoryMb: number | null
   caseBrand: string | null
   caseModel: string | null
   psuBrand: string | null
   psuModel: string | null
   hasDvdWriter: boolean | null
   hasSeparateSpeaker: boolean | null
   speakerType: string | null
   monitorInfo: string | null
   osName: string | null
   osEdition: string | null
   osVersion: string | null
   osInstalledOn: string | null
   osBuild: string | null
   officeVersion: string | null
   systemUsername: string | null
   automationUsername: string | null
}

export interface MonitorDetailDto {
   sizeInches: number | null
   panelType: string | null
   resolution: string | null
}

export interface PeripheralDetailDto {
   connectionType: string | null
   printerType: string | null
   cartridgeModel: string | null
   speakerType: string | null
}

export interface NetworkDetailDto {
   ipAddress: string | null
   netboxTitle: string | null
   hostname: string | null
   macAddress: string | null
   networkType: string | null
   port: string | null
}

export interface SoftwareDetailDto {
   vendor: string | null
   version: string | null
   edition: string | null
   licenseType: string | null
   seatCount: number | null
   licenseExpiry: string | null
   installedOn: string | null
}

export interface AssetMaintenanceDto {
   id: string
   type: string
   status: string
   title: string
   description: string | null
   scheduledFor: string | null
   completedAt: string | null
   cost: number | null
   vendor: string | null
   performedByName: string | null
   createdAt: string
}

export interface AssetOperationDto {
   id: string
   operationType: string
   performedAt: string
   description: string | null
   employeeName: string | null
}

export interface AssetInspectionDto {
   id: string
   visitedAt: string
   visitType: string | null
   healthPercent: number | null
   daysOfOperation: number | null
   temperature: number | null
   description: string | null
}

export interface AssetDetailDto extends AssetSummaryDto {
   notes: string | null
   parentAsset: { id: string; assetCode: string; name: string; type: AssetType } | null
   computer: ComputerDetailDto | null
   monitor: MonitorDetailDto | null
   peripheral: PeripheralDetailDto | null
   network: NetworkDetailDto | null
   software: SoftwareDetailDto | null
   assignments: AssetAssignmentDto[]
   components: AssetComponentDto[]
   maintenance: AssetMaintenanceDto[]
   operations: AssetOperationDto[]
   inspections: AssetInspectionDto[]
}

export interface AssetListParams {
   q?: string
   category?: string
   type?: string
   status?: string
   assigned?: "assigned" | "unassigned"
   employeeId?: string
   page?: number
   pageSize?: number
   sort?: string
}

export interface AssetListResponse {
   assets: AssetSummaryDto[]
   total: number
   page: number
   pageSize: number
   totalPages: number
}

export interface AssetOptionDto {
   id: string
   assetCode: string
   name: string
   type: AssetType
}

export interface AssetStatsDto {
   total: number
   assigned: number
   unassigned: number
   inRepair: number
   byCategory: { category: AssetCategory; count: number }[]
   byStatus: { status: AssetStatus; count: number }[]
}

export interface AssetCreateResult {
   asset: AssetDetailDto
}
