"use client"

import Link from "next/link"
import type { NavSection, NavIcon } from "@/app/lib/nav"
import { isActiveNavItem } from "@/app/lib/nav"
import BrandMark from "@/app/components/ui/BrandMark"
import { fa } from "@/lib/i18n/fa"

type ShellTone = "panel" | "admin"

interface SidebarContentProps {
    sections: NavSection[]
    tone: ShellTone
    activePathname: string
    /** Called by drawer renderings only, so the drawer closes on navigation. */
    onNavigate?: () => void
}

/**
 * One colour per navigation family. Only the 32px icon chip is tinted, which
 * keeps the rail scannable without turning the whole sidebar into a rainbow.
 */
const ICON_TONES: Record<NavIcon, string> = {
    overview: "bg-blue-500/12 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300",
    users: "bg-violet-500/12 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
    equipment: "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
    contract: "bg-cyan-500/12 text-cyan-600 dark:bg-cyan-400/15 dark:text-cyan-300",
    profile: "bg-sky-500/12 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300",
    security: "bg-amber-500/12 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300",
    tickets: "bg-rose-500/12 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300",
    home: "bg-indigo-500/12 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300",
}

/**
 * The interior of a shell sidebar — one rendering used by both the fixed
 * desktop sidebar and the mobile drawer. Keeping it in one place means the
 * two can never drift apart.
 */
export default function SidebarContent({ sections, tone, activePathname, onNavigate }: SidebarContentProps) {
    return (
        <div className="flex h-full min-h-0 grow flex-col bg-surface">
            <div className="flex h-16 shrink-0 items-center border-b border-border-subtle px-5">
                <BrandMark area={tone === "admin" ? "admin" : "panel"} />
            </div>

            <nav
                aria-label={tone === "admin" ? fa.nav.adminNavLabel : fa.nav.panelNavLabel}
                className="scrollbar-polished flex-1 overflow-y-auto px-3 py-5"
            >
                {sections.map((section, index) => (
                    <div key={section.id} className={index === 0 ? "" : "mt-6"}>
                        {section.heading ? (
                            <p className="mb-2 flex items-center gap-2 px-3 text-[11px] font-bold text-navy-400 dark:text-navy-500">
                                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-500/60" />
                                {section.heading}
                            </p>
                        ) : null}

                        <ul role="list" className="flex flex-col gap-1">
                            {section.items.map((item) => (
                                <li key={item.kind === "link" ? item.href : item.label}>
                                    {item.kind === "link" ? (
                                        <NavLink
                                            item={item}
                                            href={item.href}
                                            active={isActiveNavItem(activePathname, item.href, item.exact)}
                                            onNavigate={onNavigate}
                                        />
                                    ) : (
                                        <NavPlaceholder item={item} icon={item.icon} />
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="border-t border-border-subtle px-4 py-3">
                <p className="text-[10px] font-medium leading-5 text-navy-400 dark:text-navy-500">
                    {fa.brand} — {fa.brandTagline}
                </p>
            </div>
        </div>
    )
}

interface NavLinkProps {
    item: { kind: "link"; href: string; label: string; icon: NavIcon; badge?: string }
    href: string
    active: boolean
    onNavigate?: () => void
}

function NavLink({ item, href, active, onNavigate }: NavLinkProps) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-bold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                active
                    ? "border-brand-500/20 bg-brand-500/10 text-brand-800 shadow-sm shadow-brand-600/5 dark:border-brand-400/25 dark:bg-brand-500/15 dark:text-brand-100"
                    : "border-transparent text-navy-700 hover:border-border-subtle hover:bg-surface-muted hover:text-navy-950 dark:text-navy-200 dark:hover:border-navy-700 dark:hover:bg-navy-800/70 dark:hover:text-white"
            }`}
        >
            {active ? (
                <span
                    aria-hidden="true"
                    className="absolute inset-y-2 -start-1.5 w-1 rounded-full bg-brand-600 dark:bg-brand-400"
                />
            ) : null}

            <span
                aria-hidden="true"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                    active
                        ? "bg-brand-600 text-white shadow-md shadow-brand-600/25 dark:bg-brand-500 dark:shadow-brand-500/20"
                        : `${ICON_TONES[item.icon]} group-hover:scale-105`
                }`}
            >
                <NavIconGlyph icon={item.icon} />
            </span>

            <span className="min-w-0 flex-1 truncate">{item.label}</span>

            {item.badge ? (
                <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        active
                            ? "bg-brand-600/10 text-brand-700 dark:bg-brand-400/15 dark:text-brand-200"
                            : "bg-surface-muted text-navy-600 dark:bg-navy-800 dark:text-navy-200"
                    }`}
                >
                    {item.badge}
                </span>
            ) : null}
        </Link>
    )
}

function NavPlaceholder({ item, icon }: { item: { label: string; badge: string }; icon: NavIcon }) {
    return (
        <div
            aria-disabled="true"
            className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-dashed border-navy-300 px-3 py-2.5 text-sm font-bold text-navy-500 opacity-80 dark:border-navy-700 dark:text-navy-400"
        >
            <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-500/10 text-navy-500 dark:text-navy-400"
            >
                <NavIconGlyph icon={icon} />
            </span>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-navy-600 dark:bg-navy-800 dark:text-navy-300">
                {item.badge}
            </span>
        </div>
    )
}

function NavIconGlyph({ icon }: { icon: NavIcon }) {
    if (icon === "overview") return <SquaresIcon />
    if (icon === "users") return <UsersGlyphIcon />
    if (icon === "tickets") return <TicketIcon />
    if (icon === "equipment") return <EquipmentIcon />
    if (icon === "contract") return <ContractIcon />
    if (icon === "security") return <ShieldIcon />
    if (icon === "home") return <HomeIcon />
    return <UserCircleIcon />
}

function SquaresIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
        </svg>
    )
}

function UsersGlyphIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="8.5" r="3.2" />
            <path d="M5.5 19.5a7.5 7.5 0 0 1 15 0" />
            <path d="M19 11.5a2.8 2.8 0 0 0 0-5" />
        </svg>
    )
}

function TicketIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3.5" y="7" width="17" height="12" rx="2.5" />
            <path d="M3.5 12h17" />
            <path d="M8 7v12" />
        </svg>
    )
}

function EquipmentIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3.5" y="6.5" width="17" height="9" rx="2" />
            <path d="M12 18.5a3.5 3.5 0 0 0 0 7" />
            <path d="M12 21.5h.02" />
        </svg>
    )
}

function ContractIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3.5h7l4 4v13H7z" />
            <path d="M14 3.5v4h4" />
            <path d="M9.5 12h5" />
            <path d="M9.5 15.5h5" />
        </svg>
    )
}

function ShieldIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 3l7 3v6c0 4.2-3 7.5-7 9-4-1.5-7-4.8-7-9V6l7-3z" />
            <path d="M9.2 12.2l1.9 1.9 3.7-3.9" />
        </svg>
    )
}

function HomeIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 10.5 12 3.5l8.5 7" />
            <path d="M5.5 9.5V20h13V9.5" />
            <path d="M10 20v-5h4v5" />
        </svg>
    )
}

function UserCircleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="8.2" r="3.4" />
            <path d="M5 19.5a7.8 7.8 0 0 1 14 0" />
        </svg>
    )
}
