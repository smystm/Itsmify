"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline"
import { Dialog } from "@animate-ui/react/primitives/radix-ui"
import SidebarContent from "./SidebarContent"
import UserMenu from "@/app/components/ui/UserMenu"
import ThemeToggle from "@/app/components/ui/ThemeToggle"
import { useUserDisplay } from "@/app/components/layout/UserDisplayContext"
import { isActiveNavItem, type NavSection } from "@/app/lib/nav"
import type { SessionUser } from "@/lib/auth/session"
import { fa } from "@/lib/i18n/fa"

type ShellTone = "panel" | "admin"

interface AppShellProps {
    user: SessionUser
    sections: NavSection[]
    tone: ShellTone
    title: string
    description: string
    children: ReactNode
    /** Optional page-level subheading (e.g. a section crest on /admin). */
    small?: string
}

/**
 * The viewport chrome around both the panel and the admin area. One shell,
 * two tones — which means the mobile drawer, sticky header and ambient
 * glows can never diverge between the two again.
 */
export default function AppShell({ user, sections, tone, title, description, children, small }: AppShellProps) {
    const pathname = usePathname()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const prefersReduced = useReducedMotion()
    const displayUser = useUserDisplay()?.user ?? user

    // The active title chips off the section the user is reading.
    const activeLink = sections.flatMap((section) => section.items).find(
        (item) => item.kind === "link" && isActiveNavItem(pathname ?? "", item.href, item.exact),
    )
    const heading = typeof activeLink === "object" && activeLink !== null && "label" in activeLink ? activeLink.label : title

    const variantClass = tone === "admin" ? "from-accent-500 to-accent-700 shadow-accent-700/25" : "from-brand-600 to-brand-700 shadow-brand-700/25"

    const openDrawer = () => setDrawerOpen(true)
    const closeDrawer = () => setDrawerOpen(false)

    return (
        <div className="relative min-h-screen overflow-hidden bg-navy-100 font-vazirmatn dark:bg-navy-950" dir="rtl" lang="fa">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-6 z-50 rounded-full bg-surface px-4 py-2 text-sm font-bold text-navy-900 shadow-lg"
            >
                {fa.common.skipToContent}
            </a>

            {/* Ambient glows behind the content column only, so tables stay readable. */}
            <div aria-hidden="true" className="pointer-events-none absolute -top-40 -start-24 h-[24rem] w-[24rem] rounded-full bg-brand-400/25 blur-[130px]" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -end-24 h-[26rem] w-[26rem] rounded-full bg-accent-400/20 blur-[130px]" />

            {/* Fixed desktop sidebar. */}
            <aside
                aria-label={tone === "admin" ? fa.nav.adminNavLabel : fa.nav.panelNavLabel}
                className="fixed inset-y-0 start-0 z-40 hidden w-72 shrink-0 border-s border-border-subtle bg-surface lg:block"
            >
                <SidebarContent sections={sections} tone={tone} activePathname={pathname ?? ""} />
            </aside>

            {/* Content column, offset by the sidebar width on large screens. */}
            <div className="relative z-10 lg:ps-72">
                <header className="sticky top-0 z-30 border-b border-border-subtle/70 bg-navy-100/80 backdrop-blur supports-[backdrop-filter]:bg-navy-100/70 dark:border-navy-800/80 dark:bg-navy-950/80 dark:supports-[backdrop-filter]:bg-navy-950/70">
                    <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
                        <button
                            type="button"
                            onClick={openDrawer}
                            aria-label={drawerOpen ? fa.common.closeMenu : fa.common.openMenu}
                            aria-expanded={drawerOpen}
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-navy-600 transition-colors hover:bg-surface-muted hover:text-brand-700 dark:text-navy-200 dark:hover:bg-navy-900 dark:hover:text-brand-200 lg:hidden`}
                        >
                            <Bars3Icon aria-hidden="true" className="h-5.5 w-5.5" />
                        </button>

                        <div className="flex min-w-0 flex-1 flex-col">
                            {small ? (
                                <p className="truncate text-[11px] font-bold uppercase tracking-wider text-navy-500 dark:text-navy-400">{small}</p>
                            ) : null}
                            <h1 className="truncate text-lg font-extrabold text-navy-950 dark:text-white">{heading}</h1>
                        </div>

                        <ThemeToggle variant="surface" />
                        <UserMenu user={displayUser} tone={tone === "admin" ? "admin" : "brand"} />
                    </div>
                </header>

                <main
                    id="main-content"
                    tabIndex={-1}
                    className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8"
                >
                    <p className="sr-only">{description}</p>

                    <motion.div
                        key={pathname ?? "root"}
                        initial={pageEnterTransition(prefersReduced)}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: prefersReduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {children}
                    </motion.div>
                </main>

                <footer className="border-t border-border-subtle/70 px-4 py-6 text-center text-xs text-navy-500 sm:px-6 lg:px-8 dark:border-navy-800/80 dark:text-navy-400">
                    {fa.brand} — {fa.brandTagline}
                </footer>
            </div>

            {/* Mobile drawer — one slide-in from the inline start. */}
            <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm" />
                    <Dialog.Content
                        dir="rtl"
                        data-side="end"
                        className="fixed inset-y-0 end-0 z-50 w-80 max-w-[calc(100%-3rem)] border-s border-border-subtle bg-surface p-6 outline-none"
                    >
                        <Dialog.Title className="sr-only">{fa.nav.drawerTitle}</Dialog.Title>
                        <Dialog.Description className="sr-only">{fa.nav.drawerDescription}</Dialog.Description>
                        <div className="flex h-full flex-col">
                            <div className="mb-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span
                                        aria-hidden="true"
                                        className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-lg ${variantClass}`}
                                    >
                                        {tone === "admin" ? <ShieldMark /> : <BrandGlyph />}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-extrabold text-navy-950 dark:text-white">{fa.brand}</p>
                                        <p className="truncate text-xs font-medium text-navy-500 dark:text-navy-400">{heading}</p>
                                    </div>
                                </div>

                                <Dialog.Close asChild>
                                    <button
                                        type="button"
                                        onClick={closeDrawer}
                                        aria-label={fa.common.closeMenu}
                                        className="rounded-full p-2 text-navy-500 transition-colors hover:bg-surface-muted hover:text-brand-700 dark:text-navy-300 dark:hover:bg-navy-800 dark:hover:text-brand-200"
                                    >
                                        <XMarkIcon aria-hidden="true" className="h-5 w-5" />
                                    </button>
                                </Dialog.Close>
                            </div>

                            <SidebarContent sections={sections} tone={tone} activePathname={pathname ?? ""} onNavigate={closeDrawer} />
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    )
}

function pageEnterTransition(reduced: boolean | null): { opacity: number; y: number } | false {
    return reduced ? false : { opacity: 0, y: 14 }
}

function BrandGlyph() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 13a8 8 0 0 1 16 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <rect x="2.5" y="12.5" width="4.5" height="7" rx="1.6" fill="white" />
            <rect x="17" y="12.5" width="4.5" height="7" rx="1.6" fill="white" />
            <path d="M19.5 19.5c0 1.7-2.2 2.5-5.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
    )
}

function ShieldMark() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 3l7 3v6c0 4.2-3 7.5-7 9-4-1.5-7-4.8-7-9V6l7-3z" fill="white" />
            <path d="M9.2 12.2l1.9 1.9 3.7-3.9" stroke="#b45309" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}
