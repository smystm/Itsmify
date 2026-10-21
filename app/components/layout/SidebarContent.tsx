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
 * The interior of a shell sidebar — one rendering used by both the fixed
 * desktop sidebar and the mobile drawer. Keeping it in one place means the
 * two can never drift apart.
 */
export default function SidebarContent({ sections, tone, activePathname, onNavigate }: SidebarContentProps) {
   return (
        <div
            className={`flex h-full min-h-0 grow flex-col bg-surface`}
        >
            <div className="flex h-16 shrink-0 items-center border-b border-border-subtle px-5">
                <BrandMark area={tone === "admin" ? "admin" : "panel"} />
            </div>

            <nav aria-label={tone === "admin" ? fa.nav.adminNavLabel : fa.nav.panelNavLabel} className="flex-1 overflow-y-auto px-4 py-5">
                {sections.map((section) => (
                    <div key={section.id} className="mb-5 last:mb-1">
                        {section.heading ? (
                            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-navy-500 dark:text-navy-400">
                                {section.heading}
                            </p>
                        ) : null}

                        <ul role="list" className="flex flex-col gap-y-1.5">
                           {section.items.map((item) => (
                               <li key={item.kind === "link" ? item.href : item.label}>
                                   {item.kind === "link" ? (
                                       <NavLink item={item} href={item.href} section={tone} active={isActiveNavItem(activePathname, item.href, item.exact)} onNavigate={onNavigate} />
                                   ) : (
                                       <NavPlaceholder item={item} icon={item.icon} />
                                   )}
                               </li>
                           ))}
                        </ul>
                    </div>
                ))}
            </nav>
        </div>
    )
}

interface NavLinkProps {
    item: { kind: "link"; href: string; label: string; icon: NavIcon; badge?: string }
    href: string
    active: boolean
    section: ShellTone
    onNavigate?: () => void
}

function NavLink({ item, href, active, section, onNavigate }: NavLinkProps) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-bold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                active
                    ? section === "admin"
                        ? "border-accent-500/25 bg-accent-500/10 text-accent-800 dark:text-accent-200"
                        : "border-brand-500/25 bg-brand-500/10 text-brand-800 dark:text-brand-200"
                    : "border-transparent text-navy-700 hover:border-border-subtle hover:bg-surface-muted hover:text-brand-700 dark:text-navy-200 dark:hover:border-navy-700 dark:hover:bg-navy-800 dark:hover:text-brand-200"
            } focus-visible:outline-brand-600`}
        >
            {active ? (
                <span
                    aria-hidden="true"
                    className={`absolute inset-y-2 -start-1.5 w-1 rounded-full ${
                        section === "admin" ? "bg-accent-500" : "bg-brand-500"
                    }`}
                />
            ) : null}

            <span
                aria-hidden="true"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${
                    active
                        ? section === "admin"
                            ? "bg-accent-500/15 text-accent-800 dark:text-accent-200"
                            : "bg-brand-500/15 text-brand-700 dark:text-brand-200"
                        : "bg-navy-500/10 text-navy-600 group-hover:text-brand-700 dark:text-navy-300 dark:group-hover:text-brand-200"
                }`}
            >
                <NavIconGlyph icon={item.icon} />
            </span>

            <span className="min-w-0 flex-1 truncate">{item.label}</span>

            {item.badge ? (
                <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[10px] font-bold text-navy-600 dark:bg-navy-800 dark:text-navy-200">
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
            className="flex cursor-not-allowed items-center gap-3 rounded-2xl border border-dashed border-navy-300 px-3 py-2.5 text-sm font-bold text-navy-500 opacity-80 dark:border-navy-700 dark:text-navy-400"
        >
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-navy-500/10 text-navy-500">
                <NavIconGlyph icon={icon} />
            </span>
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[10px] font-bold text-navy-600 dark:bg-navy-800 dark:text-navy-300">
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
    if (icon === "security") return <ShieldIcon />
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

function ShieldIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 3l7 3v6c0 4.2-3 7.5-7 9-4-1.5-7-4.8-7-9V6l7-3z" />
            <path d="M9.2 12.2l1.9 1.9 3.7-3.9" />
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


