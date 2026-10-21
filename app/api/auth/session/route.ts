import type { NextRequest } from "next/server"
import { apiSessionUser } from "@/lib/auth/https"

/**
 * GET /api/auth/session — the signed-in user, narrow shape, or null.
 *
 * Used by client components that need to render their own header state after
 * navigation without another server round-trip for the whole page.
 */
export async function GET(request: NextRequest) {
   const user = await apiSessionUser(request)

   if (!user) {
      return Response.json({ user: null })
   }

   return Response.json({
      user: {
         id: user.id,
         username: user.username,
         firstName: user.firstName,
         lastName: user.lastName,
         phone: user.phone,
         role: user.role,
         status: user.status,
         mustChangePassword: user.mustChangePassword,
      },
   })
}
