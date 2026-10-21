"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DropdownMenu } from "@animate-ui/react/primitives/radix-ui"
import {
    ArrowRightStartOnRectangleIcon,
    ChevronDownIcon,
    KeyIcon,
    UserCircleIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline"
import { fa } from "@/lib/i18n/fa"
import type { SessionUser } from "@/lib/auth/session"

type UserMenuTone = "brand" | "admin"

interface UserMenuProps {
    user: SessionUser
    tone?: UserMenuTone
    /** Drawer/header chips may want the avatar only. */
    compact?: boolean
    className?: string
}

/**
 * The authenticated user's identity chip and actions, shared by the landing
 * header, the panel shell and the admin shell. Authorization is server-side
 * authority; this menu only surfaces what the server already decided.
 */
export default function UserMenu({ user, tone = "brand", compact = false, className = "" }: UserMenuProps) {
    const router = useRouter()
    const [busy, setBusy] = useState(false)
    const displayName = `${user.firstName} ${user.lastName}`.trim() || user.username
    const isSysAdmin = user.role === "SYS_ADMIN"

    const logout = async () => {
        setBusy(true)
        try {
            await fetch("/api/auth/logout", { method: "POST" })
            router.push("/login")
        } finally {
            setBusy(false)
        }
    }

    const avatarTone =
        tone === "admin"
            ? "from-accent-500 to-accent-700 shadow-accent-700/25 text-white"
            : "from-brand-600 to-brand-700 shadow-brand-700/25 text-white"

    const initials = displayName
        .split(/[\s\u200c]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    type="button"
                    className={`group inline-flex items-center gap-2 rounded-full border px-2 py-1.5 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                        tone === "admin"
                            ? "border-border-subtle bg-surface text-navy-700 hover:border-accent-400/70 hover:text-accent-800 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-100 dark:hover:border-accent-400/60 dark:hover:text-accent-200"
                            : "border-border-subtle bg-surface text-navy-700 hover:border-brand-400 hover:text-brand-700 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-100 dark:hover:border-brand-400/60 dark:hover:text-brand-200"
                    } ${className}`.trim()}
                    aria-label={fa.common.accountMenu}
                >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br text-xs font-extrabold ${avatarTone}`}>
                        {initials || fa.common.fallbackInitials}
                    </span>
                    {!compact ? (
                        <span className="hidden max-w-[12rem] truncate text-sm font-bold sm:block">{displayName}</span>
                    ) : null}
                    <ChevronDownIcon
                        aria-hidden="true"
                        className="h-4 w-4 text-navy-400 transition-transform duration-200 group-data-[state=open]:rotate-180"
                    />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="start"
                    sideOffset={10}
                    className="z-50 w-64 overflow-hidden rounded-2xl border border-border-subtle bg-surface p-1.5 text-navy-900 shadow-2xl shadow-navy-900/25 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
                >
                    <div className="px-3 py-2.5">
                        <p className="truncate text-sm font-extrabold text-navy-950 dark:text-white">{displayName}</p>
                        <p dir="ltr" className="mt-0.5 truncate text-xs font-medium text-navy-500 dark:text-navy-400">
                            {user.phone ?? user.username}
                        </p>
                    </div>

                    <DropdownMenu.Separator className="my-1 h-px bg-border-subtle dark:bg-navy-700" />

                    <DropdownMenu.Group className="flex flex-col gap-0.5">
                        <MenuItem onSelect={() => router.push("/panel")} icon={<ShieldCheckIcon className="h-4 w-4" />} label={fa.nav.panel} />
                        <MenuItem
                            onSelect={() => router.push("/panel/profile")}
                            icon={<UserCircleIcon className="h-4 w-4" />}
                            label={fa.nav.profile}
                        />
                        <MenuItem
                            onSelect={() => router.push("/change-password")}
                            icon={<KeyIcon className="h-4 w-4" />}
                            label={fa.changePassword.heading}
                        />
                        {isSysAdmin ? (
                            <MenuItem
                                onSelect={() => router.push("/admin")}
                                icon={<ShieldCheckIcon className="h-4 w-4" />}
                                label={fa.nav.admin}
                            />
                        ) : null}
                    </DropdownMenu.Group>

                    <DropdownMenu.Separator className="my-1 h-px bg-border-subtle dark:bg-navy-700" />

                    <DropdownMenu.Item
                        disabled={busy}
                        onSelect={logout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-red-700 transition-colors data-[highlighted]:bg-red-50 data-[highlighted]:text-red-800 dark:text-red-200 dark:data-[highlighted]:bg-red-500/10 dark:data-[highlighted]:text-red-100"
                    >
                        <ArrowRightStartOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
                        {busy ? fa.authPages.pleaseWait : fa.authPages.logout}
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    )
}

function MenuItem({ icon, label, onSelect }: { icon: React.ReactNode; label: string; onSelect: () => void }) {
    return (
        <DropdownMenu.Item
            onSelect={onSelect}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-navy-700 transition-colors data-[highlighted]:bg-brand-500/10 data-[highlighted]:text-brand-800 dark:text-navy-100 dark:data-[highlighted]:bg-brand-500/15 dark:data-[highlighted]:text-brand-100"
        >
            <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                {icon}
            </span>
            {label}
        </DropdownMenu.Item>
    )
}
