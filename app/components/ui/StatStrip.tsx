import type { ReactNode } from "react"

export interface StatStripItem {
    /** Pre-formatted value — text, phone number, Persian date, or count. */
    value: string
    label: string
    /** Optional small icon chip. */
    icon?: ReactNode
    /** Keeps phone numbers and IDs on their literal LTR reading. */
    dir?: "ltr" | "rtl"
    className?: string
}

interface StatStripProps {
    items: StatStripItem[]
    /** 3 for a compact summary, 4 when the key set fills two mobile rows. */
    columns?: 3 | 4
    className?: string
}

const COLUMNS: Record<3 | 4, string> = {
    3: "grid-cols-1 sm:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
}

/**
 * A row of bordered metric tiles. Deliberately strings-only: mixed copies
 * (a name next to a phone next to a date) do not share one numeric type.
 */
export default function StatStrip({ items, columns = 3, className = "" }: StatStripProps) {
    return (
        <dl className={`grid gap-4 ${COLUMNS[columns]} ${className}`.trim()}>
            {items.map((item, i) => (
                <div
                    key={item.label}
                    style={{ animationDelay: `${0.06 * (i + 1)}s` }}
                    className="animate-fade-in-up group relative h-full overflow-hidden rounded-2xl border border-border-subtle bg-surface px-5 py-6 text-center shadow-lg shadow-navy-900/5 transition-colors duration-200 hover:border-brand-400/70 dark:shadow-black/20 dark:hover:border-brand-400/40"
                >
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-bl from-brand-500/[0.07] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    />

                    {item.icon ? (
                        <span
                            aria-hidden="true"
                            className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/12 text-brand-700 transition-transform duration-300 group-hover:scale-110 dark:bg-brand-500/15 dark:text-brand-200"
                        >
                            {item.icon}
                        </span>
                    ) : null}

                    <dd
                        dir={item.dir}
                        className="bg-linear-to-l from-brand-800 to-brand-700 bg-clip-text text-lg font-extrabold text-transparent dark:from-brand-300 dark:to-brand-200"
                    >
                        {item.value}
                    </dd>
                    <dt className="mt-1 text-xs font-medium text-navy-500 dark:text-navy-400">{item.label}</dt>
                </div>
            ))}
        </dl>
    )
}
