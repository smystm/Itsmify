type NoticeTone = "error" | "success" | "info"

interface AdminNoticeProps {
    tone: NoticeTone
    children: React.ReactNode
    className?: string
}

/**
 * A short, dismissible-looking message strip. Deliberately not a toast: admin
 * decisions need a visible trail inside the surface they happened on.
 */
export default function AdminNotice({ tone, children, className = "" }: AdminNoticeProps) {
    const tones: Record<NoticeTone, string> = {
        error: "border-red-300 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200",
        success: "border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-200",
        info: "border-border-subtle bg-surface text-navy-700 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-100",
    }

    return (
        <div
            role={tone === "error" ? "alert" : undefined}
            aria-live="polite"
            className={`animate-fade-in-up rounded-2xl border px-4 py-3 text-sm font-medium ${tones[tone]} ${className}`.trim()}
        >
            {children}
        </div>
    )
}

/** Skeleton for "data is loading" blocks that do not want a full empty state. */
export function SkeletonBlock({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-2xl bg-surface-muted ${className}`.trim()} />
}
