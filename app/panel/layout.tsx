import type { ReactNode } from "react"
import { Suspense } from "react"
import PanelShell from "@/app/components/panel/PanelShell"
import { requireUser } from "@/lib/auth/auth"

/**
 * The signed-in area. The enter decision is real server work (session table +
 * account state), so it runs inside the Suspense boundary with the
 * `use cache: private` helper — Cache Components' pattern for request-time
 * auth. proxy.ts has only gated on the cookie being present; this gate is the
 * one that actually says who you are, and a stale cookie bounces instead of
 * rendering.
 *
 * The await sits inside the gate component, not at layout top level, which is
 * exactly what keeps `{children}` from being pinned behind the session read.
 */
export default function PanelLayout({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={<PanelFallback />}>
            <PanelGate>{children}</PanelGate>
        </Suspense>
    )
}

async function PanelGate({ children }: { children: ReactNode }) {
    const user = await requireUser("/login")
    return <PanelShell user={user}>{children}</PanelShell>
}

function PanelFallback() {
    return (
        <div className="min-h-screen bg-navy-100 font-vazirmatn dark:bg-navy-950" dir="rtl">
            <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 animate-pulse rounded-2xl bg-brand-400/25" />
                    <div className="h-6 w-32 animate-pulse rounded-lg bg-brand-400/15" />
                </div>
                <div className="mt-14 h-48 w-full animate-pulse rounded-3xl bg-brand-500/10" />
            </div>
        </div>
    )
}
