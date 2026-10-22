import "server-only"
import type { Prisma } from "@prisma/client"
import { fa } from "@/lib/i18n/fa"

/**
 * Organizational units and rooms are entered as free text in the existing
 * reference spreadsheets. The forms still accept text, but the service
 * resolves it to shared rows so filtering and reporting do not depend on
 * duplicated strings. Upserts make concurrent saves safe.
 */

export class OrganizationInputError extends Error {
   readonly fields: Record<string, string>

   constructor(fields: Record<string, string>) {
      super("invalid_organization_input")
      this.name = "OrganizationInputError"
      this.fields = fields
   }
}

export interface OrgLocationInput {
   orgUnitName: string
   floor: string
   roomNumber: string
}

export async function resolveOrgUnitAndLocation(
   tx: Prisma.TransactionClient,
   input: OrgLocationInput,
): Promise<{ orgUnitId: string | null; locationId: string | null }> {
   const orgUnitName = input.orgUnitName.trim()
   const floor = input.floor.trim()
   const roomNumber = input.roomNumber.trim()

   if (Boolean(floor) !== Boolean(roomNumber)) {
      throw new OrganizationInputError({
         floor: !floor ? fa.employees.locationPairRequired : "",
         roomNumber: !roomNumber ? fa.employees.locationPairRequired : "",
      })
   }

   const [orgUnit, location] = await Promise.all([
      orgUnitName
         ? tx.orgUnit.upsert({
              where: { name: orgUnitName },
              update: {},
              create: { name: orgUnitName },
              select: { id: true },
           })
         : null,
      floor && roomNumber
         ? tx.location.upsert({
              where: { floor_roomNumber: { floor, roomNumber } },
              update: {},
              create: { floor, roomNumber },
              select: { id: true },
           })
         : null,
   ])

   return {
      orgUnitId: orgUnit?.id ?? null,
      locationId: location?.id ?? null,
   }
}
