"use client"

import type { ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"
import { AnimateIcon, useAnimateIconContext } from "@animate-ui/react/icons"
import {
   ChartBarIcon,
   CheckIcon,
   CircleStackIcon,
   ClockIcon,
   ShieldCheckIcon,
   TicketIcon,
   UserGroupIcon,
   WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline"
import { fa } from "@/lib/i18n/fa"

interface HeroSectionProps {
   /** Session-aware CTA links streamed in by the server page. */
   children: ReactNode
}

const EASE = [0.22, 1, 0.36, 1] as const

const STAT_TONES = {
   blue: "bg-brand-500/10 text-brand-600 dark:bg-brand-400/15 dark:text-brand-300",
   sky: "bg-accent-500/10 text-accent-600 dark:bg-accent-400/15 dark:text-accent-300",
   emerald: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
} as const

const ACTIVITY_TONES = {
   blue: "bg-brand-500/10 text-brand-600 dark:bg-brand-400/15 dark:text-brand-300",
   emerald: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
   violet: "bg-violet-500/10 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
} as const

const FEATURE_TONES = [
   {
      icon: "bg-brand-500/10 text-brand-600 ring-brand-500/15 dark:bg-brand-400/15 dark:text-brand-300",
      iconShape: TicketIcon,
   },
   {
      icon: "bg-accent-500/10 text-accent-600 ring-accent-500/15 dark:bg-accent-400/15 dark:text-accent-300",
      iconShape: ClockIcon,
   },
   {
      icon: "bg-violet-500/10 text-violet-600 ring-violet-500/15 dark:bg-violet-400/15 dark:text-violet-300",
      iconShape: WrenchScrewdriverIcon,
   },
] as const

/**
 * Landing hero. The motion variants follow Animate UI 2.0's animation
 * conventions (the app already mounts its `AnimateUIProvider`) and every
 * animation is skipped when the visitor prefers reduced motion.
 */
export default function HeroSection({ children }: HeroSectionProps) {
   const reduceMotion = useReducedMotion()

   const reveal = (delay = 0) => ({
      initial: reduceMotion ? false : { opacity: 0, y: 18 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : delay, ease: EASE },
   })

   const stats = [
      { value: "۱۲", label: fa.landing.previewRequests, tone: "blue" as const, icon: TicketIcon },
      { value: "۱۸۴", label: fa.landing.previewAssets, tone: "sky" as const, icon: CircleStackIcon },
      { value: "۹۹٫۹٪", label: fa.landing.previewAvailability, tone: "emerald" as const, icon: ChartBarIcon },
   ]

   const activity = [
      {
         icon: TicketIcon,
         tone: "blue" as const,
         text: fa.landing.previewActivitySupport,
         time: fa.landing.previewTimeJustNow,
      },
      {
         icon: CircleStackIcon,
         tone: "emerald" as const,
         text: fa.landing.previewActivityAsset,
         time: fa.landing.previewTime2m,
      },
      {
         icon: UserGroupIcon,
         tone: "violet" as const,
         text: fa.landing.previewActivityProfile,
         time: fa.landing.previewTime15m,
      },
   ]

   return (
      <section aria-labelledby="hero-heading" className="relative">
         <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-x-0 -top-10 h-[34rem]" />

         <div className="relative grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-14">
            {/* Copy column — first in RTL, so it reads from the right. */}
            <div className="min-w-0 text-center lg:text-start">
               <motion.p
                  {...reveal(0)}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/[0.07] px-3.5 py-1.5 text-[11px] font-bold text-brand-700 dark:border-brand-400/25 dark:bg-brand-400/10 dark:text-brand-200"
               >
                  <span aria-hidden="true" className="relative flex h-2 w-2">
                     <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
                     <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600 dark:bg-brand-400" />
                  </span>
                  {fa.landing.heroBadge}
               </motion.p>

               <motion.h1
                  id="hero-heading"
                  {...reveal(0.07)}
                  className="mt-5 text-4xl font-extrabold leading-[1.35] text-navy-950 dark:text-white sm:text-5xl"
               >
                  {fa.landing.heroTitleLead}
                  <span className="mt-1 block bg-linear-to-l from-brand-700 via-brand-500 to-accent-600 bg-clip-text text-transparent dark:from-brand-300 dark:via-brand-400 dark:to-accent-300">
                     {fa.landing.heroTitleAccent}
                  </span>
               </motion.h1>

               <motion.p
                  {...reveal(0.14)}
                  className="mx-auto mt-5 max-w-xl text-[15px] leading-8 text-navy-600 dark:text-navy-300 lg:mx-0"
               >
                  {fa.landing.subtitle}
               </motion.p>

               <motion.div {...reveal(0.21)} className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                  {children}
               </motion.div>

               <motion.div
                  {...reveal(0.28)}
                  className="mt-5 flex items-start gap-2.5 rounded-2xl border border-border-subtle bg-surface/80 px-4 py-3 text-start text-xs leading-6 text-navy-600 shadow-sm backdrop-blur dark:bg-navy-900/60 dark:text-navy-300"
               >
                  <ShieldCheckIcon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" />
                  <span>{fa.landing.accountHint}</span>
               </motion.div>

               <motion.ul
                  {...reveal(0.35)}
                  className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border-subtle pt-5 lg:justify-start"
               >
                  {fa.landing.heroProofs.map((proof) => (
                     <li key={proof} className="flex items-center gap-1.5 text-[11px] font-bold text-navy-500 dark:text-navy-400">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500/10 text-brand-600 dark:bg-brand-400/15 dark:text-brand-300">
                           <CheckIcon aria-hidden="true" className="h-3 w-3" />
                        </span>
                        {proof}
                     </li>
                  ))}
               </motion.ul>
            </div>

            {/* Product preview — a purely decorative sample workspace. */}
            <motion.div
               initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.98 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.15, ease: EASE }}
               className="relative mx-auto w-full min-w-0 max-w-md lg:mx-0 lg:max-w-none"
               aria-hidden="true"
            >
               <div className="absolute -inset-5 rounded-[2.25rem] bg-linear-to-tr from-brand-500/15 via-accent-400/10 to-transparent blur-2xl" />

               <div className="relative overflow-hidden rounded-3xl border border-border-subtle bg-surface/95 p-4 shadow-2xl shadow-navy-950/10 backdrop-blur dark:border-navy-700 dark:bg-navy-900/95 dark:shadow-black/40">
                  <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3">
                     <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-brand-500/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-accent-400/80" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                     </div>
                     <p className="min-w-0 truncate text-[11px] font-bold text-navy-500 dark:text-navy-400">
                        {fa.landing.previewTitle}
                     </p>
                     <span className="shrink-0 rounded-full bg-brand-500/10 px-2 py-0.5 text-[9px] font-bold text-brand-700 dark:bg-brand-400/15 dark:text-brand-200">
                        {fa.landing.previewBadge}
                     </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                     {stats.map((stat, index) => (
                        <motion.div
                           key={stat.label}
                           initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : 0.3 + index * 0.06, ease: EASE }}
                           className="rounded-2xl border border-border-subtle bg-surface-muted/50 p-2.5 dark:border-navy-700 dark:bg-navy-800/50"
                        >
                           <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${STAT_TONES[stat.tone]}`}>
                              <stat.icon className="h-3.5 w-3.5" />
                           </span>
                           <p className="mt-2 text-start text-base font-extrabold leading-5 text-navy-950 dark:text-white">
                              {stat.value}
                           </p>
                           <p className="mt-0.5 truncate text-[9px] font-medium text-navy-500 dark:text-navy-400">{stat.label}</p>
                        </motion.div>
                     ))}
                  </div>

                  <div className="mt-3 rounded-2xl border border-border-subtle bg-surface-muted/40 p-3 dark:border-navy-700 dark:bg-navy-800/40">
                     <div className="mb-3 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-navy-700 dark:text-navy-200">{fa.landing.previewRecent}</p>
                        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                           <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                           {fa.landing.previewLive}
                        </span>
                     </div>
                     <div className="flex h-20 items-end gap-1.5 rounded-xl bg-surface/70 px-2.5 pb-2 pt-1 dark:bg-navy-900/60">
                        {[38, 62, 48, 76, 54, 88, 68].map((height, index) => (
                           <motion.span
                              key={index}
                              initial={reduceMotion ? false : { scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{
                                 duration: reduceMotion ? 0 : 0.6,
                                 delay: reduceMotion ? 0 : 0.5 + index * 0.05,
                                 ease: EASE,
                              }}
                              style={{ height: `${height}%`, transformOrigin: "bottom" }}
                              className="flex-1 rounded-t-md bg-linear-to-t from-brand-600/70 to-accent-400/70"
                           />
                        ))}
                     </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                     {activity.map((row) => (
                        <div
                           key={row.text}
                           className="flex items-center gap-2.5 rounded-xl border border-transparent px-1.5 py-1.5 transition-colors hover:border-border-subtle hover:bg-surface-muted/50 dark:hover:border-navy-700 dark:hover:bg-navy-800/40"
                        >
                           <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${ACTIVITY_TONES[row.tone]}`}>
                              <row.icon className="h-3.5 w-3.5" />
                           </span>
                           <p className="min-w-0 flex-1 truncate text-[10px] font-bold text-navy-700 dark:text-navy-200">
                              {row.text}
                           </p>
                           <span className="shrink-0 text-[9px] font-medium text-navy-400 dark:text-navy-500">{row.time}</span>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="absolute -bottom-5 -end-4 hidden items-center gap-2 rounded-2xl border border-border-subtle bg-surface px-3 py-2 shadow-xl shadow-navy-950/10 dark:border-navy-700 dark:bg-navy-900 sm:flex">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300">
                     <AnimateIcon animateOnHover animateOnView="path" animation="path" className="inline-flex">
                        <AnimatedShieldGlyph className="h-4 w-4" />
                     </AnimateIcon>
                  </span>
                  <div>
                     <p className="text-[10px] font-extrabold text-navy-900 dark:text-white">{fa.landing.previewSecure}</p>
                     <p className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                        {fa.landing.previewService}
                     </p>
                  </div>
               </div>
            </motion.div>
         </div>

         <section
            aria-label={fa.landing.featureSectionLabel}
            className="relative mx-auto mt-16 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3"
         >
            {fa.landing.featureCards.map((card, index) => {
               const tone = FEATURE_TONES[index] ?? FEATURE_TONES[0]
               const Icon = tone.iconShape
               return (
                  <motion.article
                     key={card.title}
                     initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true, amount: 0.35 }}
                     transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : index * 0.08, ease: EASE }}
                     className="group relative overflow-hidden rounded-2xl border border-border-subtle bg-surface/90 p-5 text-start shadow-sm shadow-navy-950/5 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-400/60 hover:shadow-lg hover:shadow-brand-900/5 dark:border-navy-700 dark:bg-navy-900/80 dark:hover:border-brand-400/40"
                  >
                     <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-l from-transparent via-brand-500/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                     />
                     <span
                        aria-hidden="true"
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition-transform duration-300 group-hover:scale-105 ${tone.icon}`}
                     >
                        <Icon className="h-5 w-5" />
                     </span>
                     <h2 className="mt-4 text-sm font-extrabold text-navy-950 dark:text-white">{card.title}</h2>
                     <p className="mt-1.5 text-xs leading-6 text-navy-600 dark:text-navy-300">{card.body}</p>
                  </motion.article>
               )
            })}
         </section>
      </section>
   )
}

/**
 * A tiny custom Animate UI icon: `AnimateIcon` supplies the animation state
 * (in-view / hover), and the two paths draw themselves with Motion. Kept local
 * because it is only used by the hero preview badge.
 */
function AnimatedShieldGlyph({ className }: { className?: string }) {
   const { active } = useAnimateIconContext()
   const draw = active ? { pathLength: [0, 1] } : { pathLength: 1 }

   return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
         <motion.path
            d="M12 3l7 3v6c0 4.2-3 7.5-7 9-4-1.5-7-4.8-7-9V6l7-3z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            initial={false}
            animate={draw}
            transition={{ duration: 0.9, ease: "easeInOut" }}
         />
         <motion.path
            d="M9.2 12.2l1.9 1.9 3.7-3.9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={draw}
            transition={{ duration: 0.9, ease: "easeInOut", delay: 0.15 }}
         />
      </svg>
   )
}
