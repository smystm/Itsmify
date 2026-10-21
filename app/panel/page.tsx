import type { Metadata } from "next"
import QuickActionTile from "@/app/components/ui/QuickActionTile"
import PageHero, { AvatarTile } from "@/app/components/ui/PageHero"
import StatStrip from "@/app/components/ui/StatStrip"
import { requireUser } from "@/lib/auth/auth"
import { fa } from "@/lib/i18n/fa"

export const metadata: Metadata = {
    title: fa.panel.metaTitle,
    description: fa.panel.metaDescription,
}

/**
 * The signed-in home. The ITSM module surfaces land here one at a time; each
 * already has its permission in lib/auth/permissions.ts, so a future module
 * can simply ask `can(user.role, "tickets.submit")` to gate itself.
 */
export default async function PanelPage() {
    const user = await requireUser()
    const displayName = `${user.firstName} ${user.lastName}`.trim() || user.username
    const roleLabel = fa.roles[user.role] ?? user.role
    const statusLabel = fa.admin.statuses[user.status] ?? user.status

    return (
        <div className="space-y-8">
            <PageHero
                badge={fa.panel.badge}
                title={displayName}
                description={fa.panel.heroDescription}
                leading={<AvatarTile displayName={displayName} />}
                tone="brand"
            />

            <StatStrip
                columns={4}
                items={[
                    { value: roleLabel, label: fa.panel.roleLabel, icon: <ShieldIcon className="h-5 w-5" /> },
                    { value: statusLabel, label: fa.panel.statusLabel, icon: <ClipboardIcon className="h-5 w-5" /> },
                    { value: user.phone ?? fa.panel.phoneNotSet, label: fa.panel.phoneLabel, icon: <PhoneIcon className="h-5 w-5" />, dir: "ltr" },
                    { value: new Date(user.createdAt).toLocaleDateString("fa-IR"), label: fa.panel.memberSince, icon: <CalendarIcon className="h-5 w-5" /> },
                ]}
            />

            <section aria-label={fa.panel.actionsTitle} className="animate-fade-in-up">
                <h2 className="mb-4 text-lg font-extrabold text-navy-950 dark:text-white">{fa.panel.actionsTitle}</h2>

                <div className="grid gap-4 sm:grid-cols-2">
                    <QuickActionTile
                        tone="brand"
                        icon={<TicketIcon className="h-6 w-6" />}
                        title={fa.panel.sectionTickets}
                        body={fa.panel.sectionTicketsBody}
                        cta={fa.panel.comingSoon}
                        disabled
                        badge={fa.panel.comingSoon}
                    />
                    <QuickActionTile
                        tone="brand"
                        icon={<EquipmentIcon className="h-6 w-6" />}
                        title={fa.panel.sectionEquipment}
                        body={fa.panel.sectionEquipmentBody}
                        cta={fa.panel.comingSoon}
                        disabled
                        badge={fa.panel.comingSoon}
                    />
                    <QuickActionTile
                        tone="brand"
                        icon={<UserCircleIcon className="h-6 w-6" />}
                        title={fa.panel.personalTileTitle}
                        body={fa.panel.personalTileBody}
                        cta={fa.panel.personalTileCta}
                        href="/panel/profile"
                    />
                    <QuickActionTile
                        tone="accent"
                        icon={<ShieldIcon className="h-6 w-6" />}
                        title={fa.panel.securityTileTitle}
                        body={fa.panel.securityTileBody}
                        cta={fa.panel.securityTileCta}
                        href="/change-password"
                    />
                </div>
            </section>
        </div>
    )
}

function TicketIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="7" width="17" height="12" rx="2.5" />
            <path d="M3.5 12h17" />
            <path d="M8 7v12" />
        </svg>
    )
}

function ShieldIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l7 3v6c0 4.2-3 7.5-7 9-4-1.5-7-4.8-7-9V6l7-3z" />
            <path d="M9.2 12.2l1.9 1.9 3.7-3.9" />
        </svg>
    )
}

function ClipboardIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="7" width="17" height="12" rx="2.5" />
            <path d="M3.5 12h17" />
            <path d="M8 7v12" />
        </svg>
    )
}

function PhoneIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5.5" y="3.5" width="13" height="17" rx="2.5" />
            <path d="M10 19.5h4" />
        </svg>
    )
}

function CalendarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
            <path d="M3.5 9h17" />
            <path d="M8 3.5v3M16 3.5v3" />
        </svg>
    )
}

function EquipmentIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="6.5" width="17" height="9" rx="2" />
            <path d="M3.5 18.5h17" />
            <path d="M12 18.5a3.5 3.5 0 0 0 0 7" />
        </svg>
    )
}

function UserCircleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8.2" r="3.4" />
            <path d="M5 19.5a7.8 7.8 0 0 1 14 0" />
        </svg>
    )
}
