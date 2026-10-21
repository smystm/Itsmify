import Link from "next/link"
import { Suspense } from "react"
import BrandMark from "@/app/components/ui/BrandMark"
import UserMenu from "@/app/components/ui/UserMenu"
import { getCurrentUser } from "@/lib/auth/auth"
import { fa } from "@/lib/i18n/fa"

/**
 * Public landing. Kept deliberately light: this is the door to the auth
 * group, not a marketing site — brand lockup, the three product promises, and
 * the two entry points, styled straight from the shared tokens.
 */
export default function Home() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-navy-100 dark:bg-navy-950" dir="rtl">
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

            <main className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
                <section className="mx-auto max-w-3xl text-center">
                    <h1 className="animate-fade-in-up text-4xl font-extrabold leading-[1.3] text-navy-950 dark:text-white sm:text-5xl">
                        {fa.landing.heading}
                    </h1>
                    <p className="animate-fade-in-up mt-5 text-[15px] leading-8 text-navy-600 dark:text-navy-300">
                        {fa.landing.subtitle}
                    </p>
                    <p className="mt-4 inline-block max-w-lg rounded-2xl bg-surface/70 px-4 py-2.5 text-xs leading-6 text-navy-600 backdrop-blur dark:bg-navy-900/60 dark:text-navy-300">
                        {fa.landing.accountHint}
                    </p>

                    <Suspense fallback={<div className="mx-auto mt-10 h-12 w-44 animate-pulse rounded-2xl bg-surface/70" />}>
                        <HomeHeroCta />
                    </Suspense>
                </section>

                <section aria-label={fa.landing.featureSectionLabel} className="mx-auto mt-14 grid w-full max-w-4xl grid-cols-1 gap-4 px-1 sm:grid-cols-3">
                    {fa.landing.featureCards.map((card, i) => (
                        <div
                            key={card.title}
                            style={{ animationDelay: `${0.08 * (i + 1)}s` }}
                            className="animate-fade-in-up group relative overflow-hidden rounded-3xl border border-border-subtle bg-surface p-6 text-start shadow-xl shadow-navy-900/5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/60 dark:shadow-black/25"
                        >
                            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-500/[0.07] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                            <span aria-hidden="true" className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/12 text-brand-700 transition-transform duration-300 group-hover:scale-110 dark:bg-brand-500/15 dark:text-brand-200">
                                {i === 0 ? <TicketHeroIcon /> : i === 1 ? <ClockIcon /> : <EquipmentIcon />}
                            </span>

                            <h2 className="relative mt-4 text-base font-extrabold text-navy-950 dark:text-white">{card.title}</h2>
                            <p className="relative mt-2 text-sm leading-7 text-navy-600 dark:text-navy-300">{card.body}</p>
                        </div>
                    ))}
                </section>
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
                className="rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all duration-300 hover:brightness-110 hover:shadow-xl hover:shadow-brand-700/40"
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
            <div className="flex flex-wrap justify-center gap-3">
                <Link
                    href="/panel"
                    className="inline-flex items-center gap-2 rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all duration-300 hover:brightness-110 hover:shadow-xl hover:shadow-brand-700/40"
                >
                    {fa.landing.ctaGoToPanel}
                </Link>
                {user.role === "SYS_ADMIN" ? (
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 rounded-full border border-accent-400/50 bg-surface px-6 py-3 text-sm font-bold text-accent-800 transition-colors hover:bg-accent-50 dark:bg-navy-900 dark:text-accent-200 dark:hover:bg-accent-900/30"
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
            className="inline-flex items-center gap-2 rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all duration-300 hover:brightness-110 hover:shadow-xl hover:shadow-brand-700/40"
        >
            {fa.landing.ctaLogin}
        </Link>
    )
}

/* Landing feature icons (tiny, declared inline to keep this file self-contained). */
type FeatureIconProps = { className?: string }

function TicketHeroIcon({ className }: FeatureIconProps) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round">
            <path d="M4 5h16v12H4z" />
            <path d="M9 21h6" />
            <path d="M12 17v4" />
        </svg>
    )
}
function ClockIcon({ className }: FeatureIconProps) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
        </svg>
    )
}
function EquipmentIcon({ className }: FeatureIconProps) {
    return (
        <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    )
}
