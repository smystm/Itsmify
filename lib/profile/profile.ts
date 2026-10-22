import "server-only"
import { prisma } from "@/lib/prisma"

/**
 * The narrow profile projection a signed-in user may read about themselves.
 * Session tokens, password hashes and audit details are never part of it — the
 * profile page is the same project as the session contract: least privilege.
 */
export interface PanelProfile {
   id: string
   firstName: string
   lastName: string
   username: string
   phone: string | null
   role: "EMPLOYEE" | "IT_SPECIALIST" | "IT_MANAGER" | "SYS_ADMIN"
   status: "ACTIVE" | "SUSPENDED"
   phoneVerifiedAt: string | null
   lastLoginAt: string | null
   mustChangePassword: boolean
   createdAt: string
   updatedAt: string
   employeeProfile: {
      personnelCode: string | null
      jobTitle: string | null
      employmentType: "OFFICIAL" | "CONTRACTUAL" | "TEMPORARY" | "OTHER" | null
      hireDate: string | null
      notes: string | null
      orgUnit: { id: string; name: string } | null
      location: { id: string; floor: string; roomNumber: string } | null
   } | null
   assignedAssets: {
      assignmentId: string
      assignedAt: string
      note: string | null
      asset: {
         id: string
         assetCode: string
         name: string
         category: "HARDWARE" | "SOFTWARE" | "NETWORK"
         type: string
         status: string
      }
   }[]
}

export async function getOwnProfile(userId: string): Promise<PanelProfile | null> {
   const profile = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
         id: true,
         firstName: true,
         lastName: true,
         username: true,
         phone: true,
         role: true,
         status: true,
         phoneVerifiedAt: true,
         lastLoginAt: true,
         mustChangePassword: true,
         createdAt: true,
         updatedAt: true,
         employeeProfile: {
            select: {
               personnelCode: true,
               jobTitle: true,
               employmentType: true,
               hireDate: true,
               notes: true,
               orgUnit: { select: { id: true, name: true } },
               location: { select: { id: true, floor: true, roomNumber: true } },
               assignments: {
                  where: { returnedAt: null, asset: { deletedAt: null } },
                  orderBy: { assignedAt: "desc" },
                  select: {
                     id: true,
                     assignedAt: true,
                     note: true,
                     asset: {
                        select: {
                           id: true,
                           assetCode: true,
                           name: true,
                           category: true,
                           type: true,
                           status: true,
                        },
                     },
                  },
               },
            },
         },
      },
   })

   if (!profile) return null

   return {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username,
      phone: profile.phone,
      role: profile.role,
      status: profile.status,
      phoneVerifiedAt: profile.phoneVerifiedAt?.toISOString() ?? null,
      lastLoginAt: profile.lastLoginAt?.toISOString() ?? null,
      mustChangePassword: profile.mustChangePassword,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
      employeeProfile: profile.employeeProfile
         ? {
              personnelCode: profile.employeeProfile.personnelCode,
              jobTitle: profile.employeeProfile.jobTitle,
              employmentType: profile.employeeProfile.employmentType,
              hireDate: profile.employeeProfile.hireDate?.toISOString() ?? null,
              notes: profile.employeeProfile.notes,
              orgUnit: profile.employeeProfile.orgUnit,
              location: profile.employeeProfile.location,
           }
         : null,
      assignedAssets: (profile.employeeProfile?.assignments ?? []).map((assignment) => ({
         assignmentId: assignment.id,
         assignedAt: assignment.assignedAt.toISOString(),
         note: assignment.note,
         asset: assignment.asset,
      })),
   }
}
