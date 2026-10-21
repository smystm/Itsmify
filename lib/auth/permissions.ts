/**
 * Single source of truth for roles and capabilities.
 *
 * Mirrors the reference's approach (one module everyone reads; the server
 * enforces, the UI consults for display): permission decisions live here, not
 * sprinkled through pages and route handlers. A `role` column grants the
 * capabilities; nothing is stored per-user, so changing a capability changes
 * it for every holder at once.
 */

export const ROLES = {
   EMPLOYEE: "EMPLOYEE",
   IT_SPECIALIST: "IT_SPECIALIST",
   IT_MANAGER: "IT_MANAGER",
   SYS_ADMIN: "SYS_ADMIN",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_ORDER: Role[] = [
   ROLES.EMPLOYEE,
   ROLES.IT_SPECIALIST,
   ROLES.IT_MANAGER,
   ROLES.SYS_ADMIN,
]

export function isRole(value: unknown): value is Role {
   return typeof value === "string" && (ROLE_ORDER as string[]).includes(value)
}

/**
 * The capability catalog. Each action lists the roles that hold it; `*` marks
 * actions every privileged role inherits because SYS_ADMIN can do everything.
 */
const EMPLOYEE_ACTIONS = [
   "tickets.submit",
   "tickets.read.own",
   "profile.read.own",
   "profile.phone.change",
   "profile.password.change",
] as const

const SPECIALIST_ACTIONS = [
   ...EMPLOYEE_ACTIONS,
   "panel.it",
   "equipment.read",
   "equipment.write",
   "tickets.read.all",
   "tickets.assign",
   "tickets.update",
   "tickets.resolve",
   "activity.log",
] as const

// The remaining catalog rows: MANAGER inherits SPECIALIST, SYS_ADMIN holds
// everything, so neither list survives into runtime users — the compiler reads
// them as the Action type. Kept in one place for who-holds-what reviews.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MANAGER_ACTIONS = [
   ...SPECIALIST_ACTIONS,
   "dashboard.it",
   "reports.read",
   "tickets.delete",
   "equipment.delete",
   "activity.read",
] as const

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ADMIN_ACTIONS = ["*"] as const

export type Action =
   | (typeof EMPLOYEE_ACTIONS)[number]
   | (typeof SPECIALIST_ACTIONS)[number]
   | Exclude<(typeof MANAGER_ACTIONS)[number], keyof typeof EMPLOYEE_ACTIONS>
   | (typeof ADMIN_ACTIONS)[number]
   | "admin.users.create"
   | "admin.users.read"
   | "admin.users.update"
   | "admin.users.delete"
   | "admin.users.password"

/**
 * What the signed-in user may do, in one call. Route handlers ask this FIRST,
 * before touching any data — the UI checks exist so buttons appear and
 * disappear, this one is what actually keeps data safe.
 */
export function can(role: Role | undefined | null, action: Action): boolean {
   if (!role) return false
   if (role === ROLES.SYS_ADMIN) return true // holds the `*` grant
   switch (action) {
      case "*":
         return false
      case "tickets.submit":
      case "tickets.read.own":
      case "profile.read.own":
      case "profile.phone.change":
      case "profile.password.change":
         return true // every role, including EMPLOYEE
      case "panel.it":
      case "equipment.read":
      case "equipment.write":
      case "tickets.read.all":
      case "tickets.assign":
      case "tickets.update":
      case "tickets.resolve":
      case "activity.log":
         return role === ROLES.IT_SPECIALIST || role === ROLES.IT_MANAGER
      case "dashboard.it":
      case "reports.read":
      case "tickets.delete":
      case "equipment.delete":
      case "activity.read":
         return role === ROLES.IT_MANAGER
      case "admin.users.create":
      case "admin.users.read":
      case "admin.users.update":
      case "admin.users.delete":
      case "admin.users.password":
         // SYS_ADMIN already returned true at the `*` grant above; every
         // role that reaches this case is an ordinary one.
         return false
      default:
         return false
   }
}

export function canAny(role: Role | undefined | null, ...actions: Action[]): boolean {
   return actions.some((action) => can(role, action))
}

/** True only for the wildcard role. */
export function isSysAdmin(role: Role | undefined | null): boolean {
   return role === ROLES.SYS_ADMIN
}
