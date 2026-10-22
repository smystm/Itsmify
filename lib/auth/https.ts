import "server-only"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE_NAME, sessionUserByToken, type SessionUser } from "./session"
import { can, type Action } from "./permissions"

/**
 * The route-handler side of the gate plus the small response grammar every
 * auth endpoint shares. Pages stream through `auth.ts`'s `getCurrentUser`
 * (`use cache: private`); handlers read the cookie straight from the request
 * and answer in JSON.
 */

/** The session the caller carries, or null. Never throws. */
export async function apiSessionUser(request: NextRequest): Promise<SessionUser | null> {
   const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
   if (!token) return null
   try {
      return await sessionUserByToken(token)
   } catch {
      // The database being down is not "you are not logged in" — but answering
      // 401 beats answering 500 with stack traces, and the caller relogs.
      return null
   }
}

/**
 * Guard for privileged endpoints: session must exist, its owner must have
 * completed the forced password change, and the role must hold the action.
 * Returns the error response to send, or null when the caller may proceed.
 */
export async function apiRequireRole(
   request: NextRequest,
   action: Action,
): Promise<Response | null> {
   return apiRequireAnyAction(request, action)
}

/**
 * Guard for shared screens whose roles do not all hold one single action.
 * The admin area, for example, is reachable by SYS_ADMIN (employees) and the
 * IT roles (assets), but not by every role that can log in.
 */
export async function apiRequireAnyAction(
   request: NextRequest,
   ...actions: Action[]
): Promise<Response | null> {
   const user = await apiSessionUser(request)
   if (!user) {
      return Response.json({ error: "unauthenticated" }, { status: 401 })
   }
   if (user.mustChangePassword) {
      return Response.json({ error: "password_change_required", code: "PASSWORD_CHANGE_REQUIRED" }, { status: 403 })
   }
   if (!actions.some((action) => can(user.role, action))) {
      return Response.json({ error: "forbidden" }, { status: 403 })
   }
   return null
}

/** The same password gate for non-admin self-service endpoints. */
export function passwordChangeRequired(user: SessionUser): Response | null {
   if (!user.mustChangePassword) return null
   return Response.json({ error: "password_change_required", code: "PASSWORD_CHANGE_REQUIRED" }, { status: 403 })
}

/**
 * Client request metadata for the audit trail. `x-forwarded-for` is taken
 * apart the RFC way (client, proxy1, proxy2) so the first hop wins.
 */
export function requestContext(request: NextRequest): { userAgent: string | null; ip: string | null } {
   const fwd = request.headers.get("x-forwarded-for")
   const ip = fwd ? fwd.split(",")[0].trim() : null
   return { userAgent: request.headers.get("user-agent"), ip }
}
/** One generic validation failure for the whole body. */
export function invalidBody(fields?: Record<string, string>): NextResponse {
   return NextResponse.json({ error: "validation", fields: fields ?? {} }, { status: 422 })
}

/** Wrong code / unknown challenge / burned attempts — deliberately one shape. */
export function invalidCode(): NextResponse {
   return NextResponse.json({ error: "invalid_code" }, { status: 401 })
}

/** Classifies an error thrown by an auth service into an HTTP response:
 * rate limit → 429, everything else → 500 without details. */
export function toErrorResponse(err: unknown): NextResponse {
   if (err && typeof err === "object" && "code" in err && (err as { code?: string }).code === "RATE_LIMIT") {
      return NextResponse.json({ error: "rate_limited", code: "RATE_LIMIT" }, { status: 429 })
   }
   // Unexpected (database, network, programming): say so without echoing
   // internals to the client, but log loudly here.
   console.error("[auth] unexpected error", err)
   return NextResponse.json({ error: "internal" }, { status: 500 })
}
