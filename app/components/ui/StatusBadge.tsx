type StatusTone = "approved" | "pending" | "rejected" | "neutral" | "info"

interface StatusBadgeProps {
    label: string
    tone?: StatusTone
    className?: string
}

/**
 * A tiny status pill. The tone map lives here so a badge can be reused by the
 * profile page, the admin tables and — one day — a ticket list.
 */
export default function StatusBadge({ label, tone = "neutral", className = "" }: StatusBadgeProps) {
    const tones: Record<StatusTone, string> = {
        approved: "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/25 dark:text-emerald-200 dark:ring-emerald-400/30",
        pending: "bg-amber-500/12 text-amber-700 ring-1 ring-amber-500/25 dark:text-amber-200 dark:ring-amber-400/30",
        rejected: "bg-red-500/12 text-red-700 ring-1 ring-red-500/25 dark:text-red-200 dark:ring-red-500/30",
        info: "bg-sky-500/12 text-sky-700 ring-1 ring-sky-500/25 dark:text-sky-200 dark:ring-sky-500/30",
        neutral: "bg-surface-muted text-navy-600 ring-1 ring-border-subtle dark:text-navy-200 dark:ring-border-subtle",
    }

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${tones[tone]} ${className}`.trim()}
        >
            {tone === "approved" ? (
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
            ) : tone === "pending" ? (
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
            ) : tone === "rejected" ? (
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-90" />
            ) : (
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            )}
            {label}
        </span>
    )
}

export type { StatusTone }
