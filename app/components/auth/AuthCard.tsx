"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"

interface AuthCardProps {
   children: ReactNode
   /** Extra entrance delay so the brand lockup leads the eye (ms). */
   delay?: number
}

/**
 * The one card every auth screen renders into. Ported from the reference's
 * repeated motion.div: entrance rise, surface/ border tokens, navy shadow.
 */
export default function AuthCard({ children, delay = 0.22 }: AuthCardProps) {
   const prefersReduced = useReducedMotion()

   return (
      <motion.div
         initial={{ opacity: 0, y: prefersReduced ? 0 : 24, scale: prefersReduced ? 1 : 0.98 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         transition={{ duration: 0.5, delay: prefersReduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
         className="w-full max-w-md rounded-3xl border border-border-strong bg-surface p-8 shadow-2xl shadow-navy-900/10 dark:shadow-black/30"
      >
         {children}
      </motion.div>
   )
}
