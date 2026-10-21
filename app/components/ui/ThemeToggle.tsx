"use client"

import { SunIcon, MoonIcon } from "@heroicons/react/24/outline"
import { motion, useReducedMotion } from "motion/react"
import { useTheme, type ResolvedTheme } from "@/app/components/ThemeProvider"
import { fa } from "@/lib/i18n/fa"

type ThemeToggleVariant = "ghost" | "surface"

interface ThemeToggleProps {
    variant?: ThemeToggleVariant
    className?: string
}

/**
 * The theme button every shell carries. It plays one short, platform-light
 * icon swap and nothing else — the system preference does the heavy lifting.
 */
export default function ThemeToggle({ variant = "surface", className = "" }: ThemeToggleProps) {
    const { theme, resolvedTheme, setTheme } = useTheme()
    const prefersReduced = useReducedMotion()

    const cycling = theme === "system" ? "light" : theme === "light" ? "dark" : "system"
    const nextResolved: ResolvedTheme = resolvedTheme === "light" ? "dark" : "light"

    const baseClass =
        "group relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    const variantClass =
        variant === "ghost"
            ? "text-navy-600 hover:bg-brand-500/10 hover:text-brand-700 dark:text-navy-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-200"
            : "border border-border-subtle bg-surface text-navy-600 hover:border-brand-400 hover:text-brand-700 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200 dark:hover:border-brand-400/60 dark:hover:text-brand-200"

    return (
        <button
            type="button"
            onClick={() => setTheme(cycling)}
            title={theme === "system" ? fa.common.themeSystem : theme === "light" ? fa.common.themeLight : fa.common.themeDark}
            aria-label={theme === "system" ? fa.common.themeSystem : theme === "light" ? fa.common.themeLight : fa.common.themeDark}
            className={`${baseClass} ${variantClass} ${className}`.trim()}
        >
            <motion.span
                key={nextResolved}
                aria-hidden="true"
                initial={prefersReduced ? false : { opacity: 0, scale: 0.85, rotate: nextResolved === "dark" ? -35 : 35 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex h-10 w-10 items-center justify-center"
            >
                {nextResolved === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </motion.span>
        </button>
    )
}
