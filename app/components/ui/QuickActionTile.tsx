import Link from "next/link"

type QuickActionTone = "brand" | "accent"

interface QuickActionTileProps {
    icon: React.ReactNode
    title: string
    body: string
    cta: string
    /** Required unless the tile is disabled. */
    href?: string
    /** Renders a non-interactive, muted tile with aria-disabled. */
    disabled?: boolean
    /** Small chip beside the title, e.g. «به‌زودی». */
    badge?: string
    tone?: QuickActionTone
    className?: string
}

const TONES: Record<QuickActionTone, { wash: string; icon: string; cta: string; borderHover: string }> = {
    brand: {
        wash: "from-brand-500/[0.07] to-transparent group-hover:opacity-100",
        icon: "from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-700/25",
        cta: "text-brand-700 dark:text-brand-200",
        borderHover: "hover:-translate-y-1 hover:border-brand-400 hover:shadow-xl hover:shadow-brand-500/10",
    },
    accent: {
        wash: "from-accent-500/[0.07] to-transparent group-hover:opacity-100",
        icon: "from-accent-500 to-accent-700 text-white shadow-lg shadow-accent-700/25",
        cta: "text-accent-800 dark:text-accent-200",
        borderHover: "hover:-translate-y-1 hover:border-accent-400 hover:shadow-xl hover:shadow-accent-500/10",
    },
}

/**
 * The card-shaped shortcut used by both the panel and the admin overview.
 * Disabled tiles stay honest — they are not pretending to be links.
 */
export default function QuickActionTile({
    icon,
    title,
    body,
    cta,
    href,
    disabled = false,
    badge,
    tone = "brand",
    className = "",
}: QuickActionTileProps) {
    const inert = disabled || !href
    const palette = TONES[tone]

    const shell = [
        "group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border p-6 transition-all duration-300",
        inert
            ? "cursor-not-allowed border-dashed border-navy-300 bg-surface-muted opacity-80 dark:border-navy-700 dark:bg-navy-900/40"
            : "border-border-strong bg-surface shadow-md shadow-navy-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
        inert ? "" : palette.borderHover,
        className,
    ]
        .filter(Boolean)
        .join(" ")

    const content = (
        <>
            {!inert ? (
                <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-bl opacity-0 transition-opacity duration-300 ${palette.wash}`}
                />
            ) : null}

            <span
                aria-hidden="true"
                className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ${
                    inert ? "bg-navy-200 text-navy-600 dark:bg-navy-800 dark:text-navy-300" : `bg-linear-to-br group-hover:scale-110 ${palette.icon}`
                }`}
            >
                {icon}
            </span>

            <div className="relative min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className={`text-base font-extrabold ${inert ? "text-navy-600 dark:text-navy-400" : "text-navy-950 dark:text-white"}`}>
                        {title}
                    </h3>
                    {badge ? (
                        <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-[11px] font-bold text-accent-800 dark:text-accent-200">
                            {badge}
                        </span>
                    ) : null}
                </div>

                <p className="mt-2 text-sm leading-6 text-navy-600 dark:text-navy-300">{body}</p>

                <span className={`mt-4 inline-flex items-center gap-2 text-sm font-bold ${inert ? "text-navy-600 dark:text-navy-400" : palette.cta}`}>
                    {cta}
                </span>
            </div>
        </>
    )

    if (inert) {
        return (
            <div className={shell} aria-disabled="true">
                {content}
            </div>
        )
    }

    return (
        <Link href={href ?? "/"} className={shell}>
            {content}
        </Link>
    )
}
