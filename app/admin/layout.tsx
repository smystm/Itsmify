import type { ReactNode } from "react"
import { Suspense } from "react"
import AdminShell from "@/app/components/admin/AdminShell"
import { requireAnyRole } from "@/lib/auth/auth"

/**
 * The admin area deliberately blocks navigations on the per-request role
 * check (and redirects non-admins from inside the Suspense boundary), which
 * instant-nav validation would flag as a broken prefetch shell. Opt this
 * segment out: reaching /admin is never an instant navigation by design.
 */
export const instant = false

/**
 * The privileged area of the panel.
 *
 * Two gates, deliberately:
 *   proxy.ts        — a session cookie must exist at all (cheap, no DB).
 *   this async gate — the session must be real and hold at least one
 *                     privileged capability (employee management or assets).
 * Doing role checks by hiding menu entries (the thing the requirement calls
 * out) is never enough; this is the check that runs before one byte renders.
 * Each page and API still checks its exact action.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={<AdminFallback />}>
            <AdminGate>{children}</AdminGate>
        </Suspense>
    )
}

async function AdminGate({ children }: { children: ReactNode }) {
    const user = await requireAnyRole(["admin.users.read", "equipment.read"], "/login")
    return <AdminShell user={user}>{children}</AdminShell>
}

function AdminFallback() {
    return (
        <div className="min-h-screen bg-navy-100 font-vazirmatn dark:bg-navy-950" dir="rtl">
            <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 animate-pulse rounded-2xl bg-accent-400/25" />
                    <div className="h-6 w-36 animate-pulse rounded-lg bg-accent-400/15" />
                </div>
                <div className="mt-14 h-48 w-full animate-pulse rounded-3xl bg-brand-500/10" />
            </div>
        </div>
    )
}
