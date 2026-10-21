import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { apiRequireRole, apiSessionUser, invalidBody, toErrorResponse } from "@/lib/auth/https"
import { createUserSchema, normalizedPhone, validate } from "@/lib/auth/validation"
import type { Role } from "@/lib/auth/permissions"
import { generateTemporaryPassword, hashPassword } from "@/lib/auth/password"
import { adminUserSelect, toAdminUserDto } from "@/lib/admin/users"
import { fa } from "@/lib/i18n/fa"

/**
 * GET /api/admin/users — active directory by default; `?archived=1` lists
 * soft-deleted accounts. Password hashes never leave the server.
 */
export async function GET(request: NextRequest) {
   const guard = await apiRequireRole(request, "admin.users.read")
   if (guard) return guard

   try {
      const archived = request.nextUrl.searchParams.get("archived") === "1"
      const rows = await prisma.user.findMany({
         where: archived ? { deletedAt: { not: null } } : { deletedAt: null },
         orderBy: { createdAt: "desc" },
         select: adminUserSelect,
      })
      return NextResponse.json({ users: rows.map(toAdminUserDto) })
   } catch (err) {
      return toErrorResponse(err)
   }
}

/**
 * POST /api/admin/users — provision an account. The administrator either
 * supplies an initial password or the server generates a strong one and
 * returns it exactly once. The hash is stored; the plaintext is never
 * persisted or retrievable later.
 */
export async function POST(request: NextRequest) {
   const guard = await apiRequireRole(request, "admin.users.create")
   if (guard) return guard

   const viewer = await apiSessionUser(request)
   if (!viewer) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })
   const actorId = viewer.id

   let body: unknown
   try {
      body = await request.json()
   } catch {
      return invalidBody()
   }

   const parsed = await validate(createUserSchema, body)
   if (!parsed.ok) return invalidBody(parsed.errors)

   const { firstName, lastName, username } = parsed.value
   // The yup schema already enforced the role/status sets; these casts only
   // carry that runtime guarantee into Prisma's enum types.
   const role = parsed.value.role as Role
   const status = parsed.value.status as "ACTIVE" | "SUSPENDED"
   const phone = parsed.value.phone ? normalizedPhone(parsed.value.phone) : null
   const suppliedPassword = parsed.value.password.length > 0
   const initialPassword = suppliedPassword ? parsed.value.password : generateTemporaryPassword(16)

   try {
      const [byUsername, byPhone] = await Promise.all([
         prisma.user.findUnique({ where: { username }, select: { id: true } }),
         phone ? prisma.user.findUnique({ where: { phone }, select: { id: true } }) : Promise.resolve(null),
      ])

      if (byUsername) return invalidBody({ username: fa.admin.usernameTaken })
      if (byPhone) return invalidBody({ phone: fa.admin.phoneTaken })

      const passwordHash = await hashPassword(initialPassword)

      const created = await prisma.$transaction(async (tx) => {
         const user = await tx.user.create({
            data: {
               firstName,
               lastName,
               username,
               phone,
               role,
               status,
               passwordHash,
               mustChangePassword: true,
               phoneVerifiedAt: null,
            },
            select: adminUserSelect,
         })

         await tx.accountAudit.create({
            data: {
               actorId,
               targetUserId: user.id,
               action: "CREATED",
               detail: {
                  role,
                  status,
                  phoneSet: Boolean(phone),
                  passwordGenerated: !suppliedPassword,
               },
            },
         })

         return user
      })

      return NextResponse.json(
         {
            user: toAdminUserDto(created),
            // Only a server-generated password needs to travel back; an
            // administrator-supplied one is already known to its author.
            initialPassword: suppliedPassword ? undefined : initialPassword,
         },
         { status: 201 },
      )
   } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
         const target = String(err.meta?.target ?? "")
         return invalidBody(
            target.includes("phone") ? { phone: fa.admin.phoneTaken } : { username: fa.admin.usernameTaken },
         )
      }
      return toErrorResponse(err)
   }
}
