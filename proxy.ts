import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Coarse route gate, ported from the reference storefront's proxy.ts and
 * adapted to ITSMIFY's session model.
 *
 * Everything decided here is a redirect, never a grant: the session token's
 * real validation happens server-side (next/db) in every layout and route
 * handler. This file decides which page to show — a forged cookie may slip
 * past it into the panel shell, and that shell's Suspense gate then refuses
 * to render any data.
 *
 * In-memory live-session state is deliberately NOT kept here (this runs
 * standalone from the render code); only cookie *shape/presence* is used,
 * which is exactly what the reference does and the reason the panel layout
 * re-checks the session before rendering.
 */

/** Any authenticated user may pass — including accounts that must first
 * change their password: /change-password lives outside /panel for that
 * reason and is protected by the same session-cookie gate. */
const PROTECTED_PREFIXES = ["/panel", "/change-password"]

/** SYS_ADMIN area — proxy bounces everyone without a session cookie; the
 * admin layout then re-verifies the role server-side. */
const ADMIN_PREFIX = "/admin"

export function proxy(request: NextRequest) {
   const token = request.cookies.get("itsm_session")?.value
   const { pathname } = request.nextUrl

   const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
   const isAdmin = pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`)

   // Cookie presence only — format-check (opaque base64url token, 43 chars).
   // A stale/forged cookie that reaches the app is refused by the real gate.
   const signedIn = typeof token === "string" && token.length >= 40

   // Guest trying to visit panel, admin or password screen -> login.
   // /login itself is never redirected from here: a revoked-but-present cookie
   // would otherwise ping-pong between /login and /panel forever. The login
   // POST replaces it with a fresh session normally.
   if ((isProtected || isAdmin) && !signedIn) {
      return NextResponse.redirect(new URL("/login", request.url))
   }

   return NextResponse.next()
}

export const config = {
   matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
