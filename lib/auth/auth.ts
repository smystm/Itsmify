import "server-only"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { cacheLife } from "next/cache"
import { prisma } from "@/lib/prisma"
import { SESSION_COOKIE_NAME, sessionUserByToken, type SessionUser } from "./session"
import { can, type Action } from "./permissions"

/**
 * The authorization gate every protected page goes through — the Data Access
 * Layer the Next.js auth guide describes.
 *
 * With Cache Components enabled, `cookies()` cannot be read while building
 * the static shell, and it cannot be smuggled into a plain cache either. The
 * directive that exists for exactly this situation is `use cache: private`:
 * the read happens at request time, stays on the client, and never lands in a
 * server cache shared across users. Call sites put the call behind a
 * `<Suspense>` boundary.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
   "use cache: private"
   cacheLife("minutes")

   const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
   if (!token) return null
   return sessionUserByToken(token)
}

interface LiveSession {
   user: SessionUser
   mustChangePassword: boolean
}

/**
 * The cached session is intentionally cheap; security flags that can flip
 * underneath it (password-change requirement, suspension, deletion) are read
 * live from the primary key. This closes the window where a just-reset account
 * could keep browsing with a stale "password already changed" answer.
 */
async function resolveLiveSession(): Promise<LiveSession | null> {
   const user = await getCurrentUser()
   if (!user) return null

   const live = await prisma.user.findUnique({
      where: { id: user.id },
      select: { status: true, deletedAt: true, mustChangePassword: true },
   })
   if (!live || live.status !== "ACTIVE" || live.deletedAt) return null

   return { user, mustChangePassword: live.mustChangePassword }
}

/**
 * Session-required page helper for screens that must remain reachable while a
 * password change is pending (notably /change-password itself).
 */
export async function requireSessionUser(redirectTo = "/login"): Promise<SessionUser> {
   const session = await resolveLiveSession()
   if (!session) redirect(redirectTo)
   return session.user
}

/**
 * Page-level gate for every normal signed-in surface: live ACTIVE session and
 * no pending forced password change. Pending accounts are sent to
 * /change-password before any panel/admin tree renders.
 */
export async function requireUser(redirectTo = "/login"): Promise<SessionUser> {
   const session = await resolveLiveSession()
   if (!session) redirect(redirectTo)
   if (session.mustChangePassword) redirect("/change-password")
   return session.user
}

/**
 * Role gate for protected areas. An authenticated user without the right role
 * lands on /panel (a signed-in home), a stranger on /login — both handed a
 * redirect by `redirect()` so no unauthorized tree ever renders.
 */
export async function requireRole(action: Action, redirectTo = "/login"): Promise<SessionUser> {
   const user = await requireUser(redirectTo)
   if (!can(user.role, action)) redirect("/panel")
   return user
}
