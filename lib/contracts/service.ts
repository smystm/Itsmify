import "server-only"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { UUID_RE } from "@/lib/assets/validation"
import { fa } from "@/lib/i18n/fa"
import type { ContractOptionKind } from "./kinds"
import { CONTRACT_TARGETS, type ContractTarget } from "./targets"
import type { ContractOptionDto } from "./types"
import {
   contractOptionNameKey,
   normalizeContractOptionName,
   type CreateContractOptionInput,
   type UpdateContractOptionInput,
} from "./validation"

const contractOptionSelect = {
   id: true,
   kind: true,
   name: true,
} as const satisfies Prisma.ContractOptionSelect

export class ContractServiceError extends Error {
   readonly code: string
   readonly status: number
   readonly fields?: Record<string, string>
   readonly details?: Record<string, unknown>

   constructor(
      code: string,
      status: number,
      options?: { fields?: Record<string, string>; details?: Record<string, unknown> },
   ) {
      super(code)
      this.name = "ContractServiceError"
      this.code = code
      this.status = status
      this.fields = options?.fields
      this.details = options?.details
   }
}

function isUniqueError(err: unknown): boolean {
   return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
}

export function contractErrorResponse(err: unknown): Response {
   if (err instanceof ContractServiceError) {
      return Response.json(
         {
            error: err.code,
            ...(err.fields ? { fields: err.fields } : {}),
            ...(err.details ? { details: err.details } : {}),
         },
         { status: err.status },
      )
   }
   if (isUniqueError(err)) {
      return Response.json(
         { error: "duplicate", fields: { name: fa.contractBuilder.duplicate } },
         { status: 422 },
      )
   }
   if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return Response.json({ error: "not_found" }, { status: 404 })
   }
   console.error("[contract-options] unexpected error", err)
   return Response.json({ error: "internal" }, { status: 500 })
}

export async function listContractOptions(kind?: ContractOptionKind): Promise<ContractOptionDto[]> {
   return prisma.contractOption.findMany({
      where: kind ? { kind } : undefined,
      orderBy: [{ kind: "asc" }, { name: "asc" }],
      select: contractOptionSelect,
   })
}

export async function createContractOption(input: CreateContractOptionInput): Promise<ContractOptionDto> {
   const name = normalizeContractOptionName(input.name)
   const nameKey = contractOptionNameKey(name)

   try {
      return await prisma.contractOption.create({
         data: { kind: input.kind as ContractOptionKind, name, nameKey },
         select: contractOptionSelect,
      })
   } catch (err) {
      if (isUniqueError(err)) {
         throw new ContractServiceError("duplicate", 422, {
            fields: { name: fa.contractBuilder.duplicate },
         })
      }
      throw err
   }
}

export async function updateContractOption(id: string, input: UpdateContractOptionInput): Promise<ContractOptionDto> {
   if (!UUID_RE.test(id)) throw new ContractServiceError("not_found", 404)

   const name = normalizeContractOptionName(input.name)
   const nameKey = contractOptionNameKey(name)

   try {
      return await prisma.$transaction(async (tx) => {
         const rows = await tx.$queryRaw<{ id: string; kind: ContractOptionKind; name: string; nameKey: string }[]>`
            SELECT "id", "kind", "name", "nameKey"
            FROM "contract_options"
            WHERE "id" = ${id}::uuid
            FOR UPDATE
         `
         const existing = rows[0]
         if (!existing) throw new ContractServiceError("not_found", 404)

         if (nameKey !== existing.nameKey) {
            const duplicate = await tx.contractOption.findFirst({
               where: { kind: existing.kind, nameKey },
               select: { id: true },
            })
            if (duplicate) {
               throw new ContractServiceError("duplicate", 422, {
                  fields: { name: fa.contractBuilder.duplicate },
               })
            }
         }

         const updated = await tx.contractOption.update({
            where: { id },
            data: { name, nameKey },
            select: contractOptionSelect,
         })

         if (name !== existing.name) {
            await cascadeRename(tx, existing.kind, existing.nameKey, name)
         }

         return updated
      })
   } catch (err) {
      if (isUniqueError(err)) {
         throw new ContractServiceError("duplicate", 422, {
            fields: { name: fa.contractBuilder.duplicate },
         })
      }
      throw err
   }
}

export async function deleteContractOption(id: string): Promise<void> {
   if (!UUID_RE.test(id)) throw new ContractServiceError("not_found", 404)

   await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<{ id: string; kind: ContractOptionKind; nameKey: string }[]>`
         SELECT "id", "kind", "nameKey"
         FROM "contract_options"
         WHERE "id" = ${id}::uuid
         FOR UPDATE
      `
      const option = rows[0]
      if (!option) throw new ContractServiceError("not_found", 404)

      const usedBy = await countUsage(tx, option.kind, option.nameKey)
      if (usedBy > 0) {
         throw new ContractServiceError("contract_in_use", 409, { details: { count: usedBy } })
      }

      await tx.contractOption.delete({ where: { id: option.id } })
   })
}

async function cascadeRename(
   tx: Prisma.TransactionClient,
   kind: ContractOptionKind,
   oldNameKey: string,
   name: string,
): Promise<void> {
   for (const target of CONTRACT_TARGETS[kind]) {
      const table = Prisma.raw(`"${target.table}"`)
      const column = Prisma.raw(`"${target.column}"`)

      if (target.joinAsset) {
         await tx.$executeRaw(Prisma.sql`
            UPDATE ${table} AS d
            SET ${column} = ${name}
            FROM "assets" AS a
            WHERE a."id" = d."assetId"
              AND d.${column} IS NOT NULL
              AND lower(btrim(regexp_replace(d.${column}, '[[:space:]]+', ' ', 'g'))) = ${oldNameKey}
         `)
      } else {
         await tx.$executeRaw(Prisma.sql`
            UPDATE ${table}
            SET ${column} = ${name}
            WHERE ${column} IS NOT NULL
              AND lower(btrim(regexp_replace(${column}, '[[:space:]]+', ' ', 'g'))) = ${oldNameKey}
         `)
      }
   }
}

async function countUsage(
   tx: Prisma.TransactionClient,
   kind: ContractOptionKind,
   nameKey: string,
): Promise<number> {
   let count = 0

   for (const target of CONTRACT_TARGETS[kind]) {
      const rows = await countTarget(tx, target, nameKey)
      count += rows
   }

   return count
}

async function countTarget(
   tx: Prisma.TransactionClient,
   target: ContractTarget,
   nameKey: string,
): Promise<number> {
   const table = Prisma.raw(`"${target.table}"`)
   const column = Prisma.raw(`"${target.column}"`)

   const rows = target.joinAsset
      ? await tx.$queryRaw<{ count: number }[]>(Prisma.sql`
           SELECT COUNT(*)::int AS "count"
           FROM ${table} AS d
           JOIN "assets" AS a ON a."id" = d."assetId"
           WHERE a."deletedAt" IS NULL
             AND d.${column} IS NOT NULL
             AND lower(btrim(regexp_replace(d.${column}, '[[:space:]]+', ' ', 'g'))) = ${nameKey}
        `)
      : await tx.$queryRaw<{ count: number }[]>(Prisma.sql`
           SELECT COUNT(*)::int AS "count"
           FROM ${table}
           WHERE "deletedAt" IS NULL
             AND ${column} IS NOT NULL
             AND lower(btrim(regexp_replace(${column}, '[[:space:]]+', ' ', 'g'))) = ${nameKey}
        `)

   return rows[0]?.count ?? 0
}
