/**
 * Row shapes the /api/admin endpoints return — declared once, used by the
 * overview and the user-management panel. Dates arrive as ISO strings over
 * JSON and `passwordHash` never crosses the wire (only `hasPassword`).
 */
export type AdminRole = "EMPLOYEE" | "IT_SPECIALIST" | "IT_MANAGER" | "SYS_ADMIN"
export type AdminStatus = "ACTIVE" | "SUSPENDED"

export interface AdminUser {
   id: string
   firstName: string
   lastName: string
   username: string
   phone: string | null
   role: AdminRole
   status: AdminStatus
   phoneVerifiedAt: string | null
   mustChangePassword: boolean
   lastLoginAt: string | null
   createdAt: string
   deletedAt: string | null
   hasPassword: boolean
}
