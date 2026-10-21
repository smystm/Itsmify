import { fa } from "@/lib/i18n/fa"
import type { SessionUser } from "@/lib/auth/session"

/**
 * Navigation is declared once and rendered by the shared shell. Icons are
 * referenced by a small union — keeping React out of this module lets both
 * server and client components read the same navigation definition.
 */
export type NavIcon = "overview" | "users" | "profile" | "security" | "tickets" | "equipment"

export interface NavLinkItem {
    kind: "link"
    href: string
    label: string
    icon: NavIcon
    /** Only this exact route counts as active. */
    exact?: boolean
    badge?: string
}

export interface NavPlaceholderItem {
    kind: "placeholder"
    label: string
    icon: NavIcon
    badge: string
}

export type NavItem = NavLinkItem | NavPlaceholderItem

export interface NavSection {
    id: string
    heading?: string
    items: NavItem[]
}

export function panelNavSections(user: SessionUser): NavSection[] {
    const sections: NavSection[] = [
        {
            id: "main",
            heading: fa.nav.groupMain,
            items: [
                {
                    kind: "link",
                    href: "/panel",
                    label: fa.nav.panel,
                    icon: "overview",
                    exact: true,
                },
                {
                    kind: "link",
                    href: "/panel/profile",
                    label: fa.nav.profile,
                    icon: "profile",
                },
            ],
        },
        {
            id: "roadmap",
            heading: fa.nav.groupRoadmap,
            items: [
                {
                    kind: "placeholder",
                    label: fa.nav.tickets,
                    icon: "tickets",
                    badge: fa.common.comingSoon,
                },
                {
                    kind: "placeholder",
                    label: fa.nav.equipment,
                    icon: "equipment",
                    badge: fa.common.comingSoon,
                },
            ],
        },
    ]

    if (user.role === "SYS_ADMIN") {
        sections.push({
            id: "other",
            heading: fa.nav.groupOther,
            items: [
                {
                    kind: "link",
                    href: "/admin",
                    label: fa.nav.admin,
                    icon: "security",
                },
            ],
        })
    }

    return sections
}

export function adminNavSections(): NavSection[] {
    return [
        {
            id: "main",
            heading: fa.nav.groupMain,
            items: [
                {
                    kind: "link",
                    href: "/admin",
                    label: fa.nav.adminOverview,
                    icon: "overview",
                    exact: true,
                },
                {
                    kind: "link",
                    href: "/admin/users",
                    label: fa.nav.users,
                    icon: "users",
                },
            ],
        },
        {
            id: "roadmap",
            heading: fa.nav.groupRoadmap,
            items: [
                {
                    kind: "placeholder",
                    label: fa.nav.tickets,
                    icon: "tickets",
                    badge: fa.common.comingSoon,
                },
                {
                    kind: "placeholder",
                    label: fa.nav.equipment,
                    icon: "equipment",
                    badge: fa.common.comingSoon,
                },
            ],
        },
        {
            id: "other",
            heading: fa.nav.groupOther,
            items: [
                {
                    kind: "link",
                    href: "/panel",
                    label: fa.nav.panel,
                    icon: "profile",
                },
            ],
        },
    ]
}

export function isActiveNavItem(pathname: string, href: string, exact?: boolean): boolean {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
}
