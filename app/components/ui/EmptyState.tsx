type EmptyTone = "brand" | "accent"

interface EmptyStateProps {
    icon: React.ReactNode
    title: string
    body: string
    /** Optional trailing call to action. */
    action?: { label: string; href: string }
    tone?: EmptyTone
    className?: string
}

const TONES: Record<EmptyTone, { glow: string; icon: string; border: string; cta: string }> = {
    brand: {
        glow: "bg-brand-500/10",
        icon: "bg-brand-500/12 text-brand-700 dark:text-brand-200",
        border: "border-dashed border-navy-300 dark:border-navy-700",
        cta: "bg-linear-to-l from-brand-700 to-brand-800 text-white shadow-md shadow-brand-700/25 hover:brightness-110",
    },
    accent: {
        glow: "bg-accent-500/10",
        icon: "bg-accent-500/15 text-accent-800 dark:text-accent-200",
        border: "border-dashed border-accent-300 dark:border-accent-500/40",
        cta: "bg-linear-to-l from-accent-600 to-accent-700 text-white shadow-md shadow-accent-700/25 hover:brightness-110",
    },
}

/**
 * The "nothing here yet" block shared by the panel, the profile page and the
 * admin tables — deliberately warmer than a grey message, since it usually
 * means the workspace is still growing.
 */
export default function EmptyState({ icon, title, body, action, tone = "brand", className = "" }: EmptyStateProps) {
    const palette = TONES[tone]

    return (
        <section
            className={`animate-fade-in-up relative overflow-hidden rounded-3xl ${palette.border} bg-surface px-6 py-14 text-center shadow-xl shadow-navy-900/5 dark:shadow-black/20 ${className}`.trim()}
            aria-live="polite"
        >
            <div
                aria-hidden="true"
                className={`pointer-events-none absolute -top-24 -start-24 h-56 w-56 rounded-full blur-3xl ${palette.glow}`}
            />
            <div
                aria-hidden="true"
                className={`pointer-events-none absolute -bottom-24 -end-20 h-48 w-48 rounded-full blur-3xl ${palette.glow}`}
            />

            <div className="relative z-10 mx-auto flex max-w-md flex-col items-center">
                <span
                    aria-hidden="true"
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${palette.icon}`}
                >
                    {icon}
                </span>

                <h3 className="mt-5 text-lg font-extrabold text-navy-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-navy-600 dark:text-navy-300">{body}</p>

                {action ? (
                    <a
                        href={action.href}
                        className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${palette.cta}`.trim()}
                    >
                        {action.label}
                    </a>
                ) : null}
            </div>
        </section>
    )
}
