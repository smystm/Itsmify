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
        },
    })

    if (!profile) return null

    return {
        ...profile,
        phoneVerifiedAt: profile.phoneVerifiedAt?.toISOString() ?? null,
        lastLoginAt: profile.lastLoginAt?.toISOString() ?? null,
        createdAt: profile.createdAt.toISOString(),
        updatedAt: profile.updatedAt.toISOString(),
    }
}
