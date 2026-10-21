import { fa } from "@/lib/i18n/fa"

interface BrandMarkProps {
   /** The layout that is rendering the mark — controls the small subtitle. */
   area?: "landing" | "panel" | "admin" | "auth"
   onClick?: () => void
}

/**
 * The one brand lockup every shell reuses. Keeping it in one place stops the
 * "which logo is slightly different on this page" drift.
 */
export default function BrandMark({ area = "landing", onClick }: BrandMarkProps) {
    const subtitle =
        area === "auth" ? fa.brandTagline : area === "panel" ? fa.panel.metaTitle : area === "admin" ? fa.admin.metaTitle : fa.brandTagline

    const content = (
        <>
            <span
                aria-hidden="true"
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-lg ${
                    area === "admin" ? "from-accent-500 to-accent-700 shadow-accent-700/25" : "from-brand-600 to-brand-700 shadow-brand-700/25"
                } bg-linear-to-br`}
            >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M4 13a8 8 0 0 1 16 0" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <rect x="2.5" y="12.5" width="4.5" height="7" rx="1.6" fill="white" />
                    <rect x="17" y="12.5" width="4.5" height="7" rx="1.6" fill="white" />
                    <path d="M19.5 19.5c0 1.7-2.2 2.5-5.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </span>

            <span className="min-w-0">
                <span className="block text-lg font-extrabold leading-6 text-navy-950 dark:text-white">{fa.brand}</span>
                <span className="block truncate text-xs font-medium text-navy-500 dark:text-navy-400">{subtitle}</span>
            </span>
        </>
    )

    if (!onClick) {
        return <div className="flex min-w-0 items-center gap-3">{content}</div>
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex min-w-0 items-center gap-3 text-start transition-opacity hover:opacity-80"
        >
            {content}
        </button>
    )
}
