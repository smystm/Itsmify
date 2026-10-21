import { PrismaClient } from "@prisma/client"

/**
 * One PrismaClient per process.
 *
 * Next.js dev reloads route modules on every change; constructing the client at
 * module scope in each copy would exhaust Postgres' connection slots within a
 * few edits. The instance is kept on `globalThis` so hot reloads reuse it, and
 * production (single global import graph) just gets a plain singleton.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
   globalForPrisma.prisma ??
   new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
   })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
