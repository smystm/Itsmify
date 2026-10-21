/**
 * Shared projection for administrator user lists. `passwordHash` is selected
 * only to compute `hasPassword` and is stripped before the response — no
 * endpoint ever returns the hash itself.
 */
export const adminUserSelect = {
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
   deletedAt: true,
   passwordHash: true,
} as const

export interface AdminUserRow {
   id: string
   firstName: string
   lastName: string
   username: string
   phone: string | null
   role: "EMPLOYEE" | "IT_SPECIALIST" | "IT_MANAGER" | "SYS_ADMIN"
   status: "ACTIVE" | "SUSPENDED"
   phoneVerifiedAt: Date | null
   mustChangePassword: boolean
   lastLoginAt: Date | null
   createdAt: Date
   deletedAt: Date | null
   passwordHash: string | null
}

export interface AdminUserDto extends Omit<AdminUserRow, "passwordHash"> {
   hasPassword: boolean
}

export function toAdminUserDto(row: AdminUserRow): AdminUserDto {
   const { passwordHash, ...rest } = row
   return { ...rest, hasPassword: Boolean(passwordHash) }
}
