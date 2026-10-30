import { fa } from "@/lib/i18n/fa"
import { can } from "@/lib/auth/permissions"
import type { SessionUser } from "@/lib/auth/session"

/**
 * Navigation is declared once and rendered by the shared shell. Icons are
 * referenced by a small union — keeping React out of this module lets both
 * server and client components read the same navigation definition.
 */
export type NavIcon = "overview" | "users" | "profile" | "security" | "tickets" | "equipment" | "contract" | "home"

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
                ...(can(user.role, "equipment.read")
                    ? ([
                         {
                             kind: "link",
                             href: "/admin/assets",
                             label: fa.nav.assets,
                             icon: "equipment",
                         },
                      ] satisfies NavItem[])
                    : ([
                         {
                             kind: "placeholder",
                             label: fa.nav.equipment,
                             icon: "equipment",
                             badge: fa.common.comingSoon,
                         },
                      ] satisfies NavItem[])),
            ],
        },
    ]

    const otherItems: NavItem[] = []
    if (can(user.role, "admin.users.read") || can(user.role, "equipment.read")) {
        otherItems.push({
            kind: "link",
            href: "/admin",
            label: fa.nav.admin,
            icon: "security",
        })
    }
    otherItems.push({
        kind: "link",
        href: "/",
        label: fa.nav.backToHome,
        icon: "home",
        exact: true,
    })
    sections.push({
        id: "other",
        heading: fa.nav.groupOther,
        items: otherItems,
    })

    return sections
}

export function adminNavSections(user: SessionUser): NavSection[] {
    const managementItems: NavItem[] = []

    if (can(user.role, "admin.users.read")) {
        managementItems.push({
            kind: "link",
            href: "/admin/employees",
            label: fa.nav.employees,
            icon: "users",
        })
    }
    if (can(user.role, "equipment.read")) {
        managementItems.push({
            kind: "link",
            href: "/admin/assets",
            label: fa.nav.assets,
            icon: "equipment",
        })
    }
    if (can(user.role, "equipment.options.manage")) {
        managementItems.push({
            kind: "link",
            href: "/admin/contract-builder",
            label: fa.nav.contractBuilder,
            icon: "contract",
        })
    }

    const sections: NavSection[] = [
        {
            id: "main",
            heading: fa.nav.groupWorkspace,
            items: [
                {
                    kind: "link",
                    href: "/admin",
                    label: fa.nav.adminOverview,
                    icon: "overview",
                    exact: true,
                },
            ],
        },
    ]

    if (managementItems.length > 0) {
        sections.push({
            id: "management",
            heading: fa.nav.groupManagement,
            items: managementItems,
        })
    }

    sections.push(
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
                {
                    kind: "link",
                    href: "/",
                    label: fa.nav.backToHome,
                    icon: "home",
                    exact: true,
                },
            ],
        },
    )

    return sections
}

export function isActiveNavItem(pathname: string, href: string, exact?: boolean): boolean {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
}
