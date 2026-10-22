/**
 * Wire shapes for the employee module. Dates are ISO strings because every
 * consumer receives them through JSON; Prisma Date objects never cross the
 * server boundary.
 */

export type EmployeeRole = "EMPLOYEE" | "IT_SPECIALIST" | "IT_MANAGER" | "SYS_ADMIN"
export type EmployeeStatus = "ACTIVE" | "SUSPENDED"
export type EmployeeEmploymentType = "OFFICIAL" | "CONTRACTUAL" | "TEMPORARY" | "OTHER"

export interface EmployeeOrgUnitDto {
   id: string
   name: string
}

export interface EmployeeLocationDto {
   id: string
   floor: string
   roomNumber: string
}

export interface EmployeeProfileDto {
   id: string
   personnelCode: string | null
   nationalId: string | null
   jobTitle: string | null
   employmentType: EmployeeEmploymentType | null
   hireDate: string | null
   notes: string | null
   orgUnit: EmployeeOrgUnitDto | null
   location: EmployeeLocationDto | null
   activeAssetCount: number
   createdAt: string
   updatedAt: string
}

export interface AdminEmployeeDto {
   id: string
   firstName: string
   lastName: string
   username: string
   phone: string | null
   role: EmployeeRole
   status: EmployeeStatus
   phoneVerifiedAt: string | null
   mustChangePassword: boolean
   lastLoginAt: string | null
   createdAt: string
   updatedAt: string
   deletedAt: string | null
   hasPassword: boolean
   profile: EmployeeProfileDto | null
}

export interface EmployeeAssignedAssetDto {
   assignmentId: string
   assignedAt: string
   note: string | null
   asset: {
      id: string
      assetCode: string
      name: string
      category: "HARDWARE" | "SOFTWARE" | "NETWORK"
      type: string
      status: string
      brand: string | null
      model: string | null
      serialNumber: string | null
   }
}

export interface EmployeeAuditDto {
   id: string
   action: string
   detail: unknown
   createdAt: string
   actorName: string | null
}

export interface EmployeeDetailDto extends AdminEmployeeDto {
   assets: EmployeeAssignedAssetDto[]
   audit: EmployeeAuditDto[]
}

export interface EmployeeLookupDto {
   id: string
   profileId: string
   firstName: string
   lastName: string
   username: string
   personnelCode: string | null
   orgUnit: EmployeeOrgUnitDto | null
   location: EmployeeLocationDto | null
   activeAssetCount: number
}

export interface EmployeeListResponse {
   employees: AdminEmployeeDto[]
   total: number
   page: number
   pageSize: number
   totalPages: number
}

export interface EmployeeListParams {
   q?: string
   role?: string
   status?: string
   orgUnitId?: string
   archived?: boolean
   page?: number
   pageSize?: number
   sort?: string
}

export interface EmployeeCreateResult {
   employee: AdminEmployeeDto
   initialPassword?: string
}
