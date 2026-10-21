import { fa } from "@/lib/i18n/fa"

type PageHeroTone = "brand" | "accent" | "admin"

interface PageHeroProps {
    /** Plain text or a short ReactNode when the heading needs a name chip. */
    title: React.ReactNode
    description?: string
    /** A chip above the title — e.g. «خوش آمدید» or «فوق‌محرمانه». */
    badge?: string
    /** Optional leading visual, e.g. the avatar tile on /panel. */
    leading?: React.ReactNode
    /** Optional trailing buttons (slot, so they can be a Link or client button). */
    actions?: React.ReactNode
    tone?: PageHeroTone
    className?: string
}

const TONES: Record<PageHeroTone, { border: string; light: string; dark: string; glowBrand: string; glowAccent: string }> = {
    brand: {
        border: "border-brand-500/20 dark:border-brand-400/20",
        light: "from-brand-50 via-surface to-accent-50/70",
        dark: "dark:from-navy-900 dark:via-navy-950 dark:to-navy-900",
        glowBrand: "bg-brand-400/30 dark:bg-brand-500/25",
        glowAccent: "bg-accent-400/35 dark:bg-accent-500/20",
    },
    accent: {
        border: "border-accent-500/25 dark:border-accent-400/25",
        light: "from-accent-50 via-surface to-brand-50/70",
        dark: "dark:from-navy-900 dark:via-navy-950 dark:to-navy-900",
        glowBrand: "bg-brand-400/30 dark:bg-brand-500/25",
        glowAccent: "bg-accent-400/35 dark:bg-accent-500/20",
    },
    admin: {
        border: "border-accent-500/25 dark:border-accent-400/25",
        light: "from-accent-50 via-surface to-brand-50/70",
        dark: "dark:from-navy-900 dark:via-navy-950 dark:to-navy-900",
        glowBrand: "bg-brand-400/30 dark:bg-brand-500/25",
        glowAccent: "bg-accent-400/35 dark:bg-accent-500/20",
    },
}

/**
 * The soft gradient band that opens each page in the panel and admin shell.
 * The palette is entirely theme-swapping, so it reads correctly in light and
 * dark mode without a separate component.
 */
export default function PageHero({
    title,
    description,
    badge,
    leading,
    actions,
    tone = "brand",
    className = "",
}: PageHeroProps) {
    const palette = TONES[tone]

    return (
        <section
            className={`animate-fade-in-up relative overflow-hidden rounded-3xl border ${palette.border} bg-linear-to-bl ${palette.light} ${palette.dark} px-6 py-10 shadow-2xl shadow-navy-900/10 sm:px-8 sm:py-12 dark:shadow-black/30 ${className}`.trim()}
        >
            <div
                aria-hidden="true"
                className={`pointer-events-none absolute -top-20 -end-20 h-64 w-64 rounded-full blur-[90px] ${palette.glowBrand}`}
            />
            <div
                aria-hidden="true"
                className={`pointer-events-none absolute -bottom-24 -start-16 h-64 w-64 rounded-full blur-[90px] ${palette.glowAccent}`}
            />

            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 text-navy-600 opacity-[0.10] dark:text-navy-100 dark:opacity-[0.06]"
                style={{
                    backgroundImage:
                        "linear-gradient(to left, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                }}
            />

            <div className="relative z-10">
                <div className="flex flex-col-reverse items-start gap-6 sm:flex-row sm:items-center">
                    {leading}
                    <div className="min-w-0 flex-1">
                        {badge ? (
                            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-4 py-1.5 text-xs font-bold text-brand-700 dark:border-brand-400/30 dark:bg-brand-500/10 dark:text-brand-200">
                                {badge}
                            </span>
                        ) : null}

                        <h1 className={`font-extrabold tracking-tight text-navy-950 dark:text-white sm:text-4xl ${badge ? "mt-4" : ""}`}>
                            {title}
                        </h1>
                        {description ? (
                            <p className="mt-3 max-w-xl text-[15px] leading-7 text-navy-600 dark:text-navy-300">{description}</p>
                        ) : null}
                    </div>

                    {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
                </div>
            </div>
        </section>
    )
}

export type { PageHeroTone }

export function AvatarTile({ displayName, tone = "brand" }: { displayName: string; tone?: PageHeroTone }) {
    const initials = displayName
        .split(/[\s\u200c]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")

    return (
        <span
            aria-hidden="true"
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold text-white shadow-lg ${
                tone === "admin" ? "from-accent-500 to-accent-700 shadow-accent-700/25" : "from-brand-600 to-brand-700 shadow-brand-700/25"
            } bg-linear-to-br`}
        >
            {initials || fa.common.fallbackInitials}
        </span>
    )
}
