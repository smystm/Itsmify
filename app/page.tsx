import Link from "next/link"
import { Suspense } from "react"
import BrandMark from "@/app/components/ui/BrandMark"
import UserMenu from "@/app/components/ui/UserMenu"
import HeroSection from "@/app/components/home/HeroSection"
import { getCurrentUser } from "@/lib/auth/auth"
import { fa } from "@/lib/i18n/fa"

/**
 * Public landing. The shell stays server-rendered; the hero is a client
 * component so its Animate UI / Motion choreography can run, while the
 * session-aware CTA continues to stream in behind a Suspense boundary.
 */
export default function Home() {
    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-navy-100 dark:bg-navy-950" dir="rtl">
            <div aria-hidden="true" className="pointer-events-none absolute -top-48 -start-40 h-[28rem] w-[28rem] rounded-full bg-brand-400/25 blur-[130px]" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-52 -end-40 h-[30rem] w-[30rem] rounded-full bg-accent-400/20 blur-[130px]" />

            <header className="sticky top-0 z-30 border-b border-border-subtle/70 bg-navy-100/85 backdrop-blur-xl dark:border-navy-800/80 dark:bg-navy-950/85 dark:supports-[backdrop-filter]:bg-navy-950/75">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
                    <BrandMark area="landing" />

                    <Suspense fallback={<div className="h-11 w-28 animate-pulse rounded-2xl bg-surface/70" />}>
                        <HomeHeaderActions />
                    </Suspense>
                </div>
            </header>

            <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
                <HeroSection>
                    <Suspense fallback={<div className="h-12 w-44 animate-pulse rounded-xl bg-surface/70" />}>
                        <HomeHeroCta />
                    </Suspense>
                </HeroSection>
            </main>

            <footer className="border-t border-border-subtle/70 bg-surface/70 py-6 text-center text-xs text-navy-500 dark:border-navy-800/80 dark:bg-navy-950/70 dark:text-navy-400">
                {fa.brand} — {fa.brandTagline}
            </footer>
        </div>
    )
}

/**
 * The landing header CTA depends on the session, so it streams in behind a
 * Suspense boundary. The fallback is deliberately neutral — a signed-in user
 * never sees the guest login button flash.
 */
async function HomeHeaderActions() {
    const user = await getCurrentUser()

    if (!user) {
        return (
            <Link
                href="/login"
                className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition-all duration-300 hover:bg-brand-500 hover:shadow-xl hover:shadow-brand-600/30"
            >
                {fa.landing.ctaLogin}
            </Link>
        )
    }

    return <UserMenu user={user} tone="brand" />
}

async function HomeHeroCta() {
    const user = await getCurrentUser()

    if (user) {
        return (
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link
                    href="/panel"
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition-all duration-300 hover:bg-brand-500 hover:shadow-xl hover:shadow-brand-600/30"
                >
                    {fa.landing.ctaGoToPanel}
                </Link>
                {user.role === "SYS_ADMIN" ? (
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-surface px-6 py-3 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50 dark:border-brand-400/40 dark:bg-navy-900 dark:text-brand-200 dark:hover:bg-brand-500/10"
                    >
                        {fa.landing.ctaGoToAdmin}
                    </Link>
                ) : null}
            </div>
        )
    }

    return (
        <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition-all duration-300 hover:bg-brand-500 hover:shadow-xl hover:shadow-brand-600/30"
        >
            {fa.landing.ctaLogin}
        </Link>
    )
}
