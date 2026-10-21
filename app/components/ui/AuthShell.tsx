"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"

interface AuthShellProps {
   children: ReactNode
}

/**
 * Shared backdrop + centered column for every page in the (auth) group.
 * Ported from the reference AuthShell: the same navy page background, ambient
 * brand/accent glows and grid texture, so auth visually matches the rest of
 * the design system.
 */
export default function AuthShell({ children }: AuthShellProps) {
   const prefersReduced = useReducedMotion()

   return (
      <div className="relative min-h-screen overflow-hidden bg-navy-100 font-vazirmatn dark:bg-navy-950">
         {/* Ambient glows — drift on Y/scale only, so RTL never changes the feel. */}
         <motion.div
            aria-hidden="true"
            animate={prefersReduced ? undefined : { y: [0, -30, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -top-40 -start-40 h-[26rem] w-[26rem] rounded-full bg-brand-400/30 blur-[120px] dark:bg-brand-500/25"
         />
         <motion.div
            aria-hidden="true"
            animate={prefersReduced ? undefined : { y: [0, 26, 0], scale: [1, 1.06, 1] }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="pointer-events-none absolute -bottom-48 -end-48 h-[28rem] w-[28rem] rounded-full bg-accent-400/25 blur-[120px] dark:bg-accent-500/20"
         />

         {/* Grid texture */}
         <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 text-navy-600 opacity-[0.07] dark:text-navy-100 dark:opacity-[0.05]"
            style={{
               backgroundImage:
                  "linear-gradient(to left, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
               backgroundSize: "48px 48px",
            }}
         />

         <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">{children}</div>
      </div>
   )
}
