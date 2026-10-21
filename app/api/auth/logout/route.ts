import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import {
   SESSION_COOKIE_NAME,
   destroySession,
   clearSessionCookieOptions,
} from "@/lib/auth/session"

/**
 * POST /api/auth/logout — ends the session the request carries.
 *
 * The row is deleted, not just flagged: the credential stops existing for the
 * browser *and* the database in one step, which is what the reference's
 * `removeLoginAuth` wanted but a column-based token could not do.
 */
export async function POST(request: NextRequest) {
   const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

   if (token) {
      try {
         await destroySession(token)
      } catch (err) {
         console.error("[auth] logout failed", err)
         // Still clear the cookie below: the browser side must not keep a
         // credential around even if the row delete hiccupped.
      }
   }

   const res = NextResponse.json({ ok: true })
   res.cookies.set(SESSION_COOKIE_NAME, "", clearSessionCookieOptions())
   return res
}
