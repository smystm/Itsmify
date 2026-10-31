"use client"

import Link from "next/link"
import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import {
   ArrowLeftIcon,
   ArrowRightIcon,
   CheckIcon,
   ExclamationTriangleIcon,
} from "@heroicons/react/24/outline"
import { useFormikContext, type FormikTouched, type FormikValues } from "formik"
import Button from "@/app/components/ui/Button"
import { toPersianDigits } from "@/lib/date/jalali"
import { fa } from "@/lib/i18n/fa"

export interface StepFormStep {
   id: string
   title: string
   hint?: string
   icon: ReactNode
   /** Top-level Formik keys owned by this step — powers error badges and step navigation. */
   errorKeys: string[]
   content: ReactNode
}

interface StepFormProps {
   steps: StepFormStep[]
   cancelHref: string
   cancelLabel: string
   submitLabel: string
   submittingLabel: string
   /** Enables live validation in the parent form after the first submit attempt. */
   onSubmitAttempt: () => void
}

type TouchedTree = boolean | { [key: string]: TouchedTree }

function touchTree(value: unknown): TouchedTree {
   if (Array.isArray(value)) return value.map(touchTree) as unknown as TouchedTree
   if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, touchTree(child)]))
   }
   return true
}

function countErrors(value: unknown): number {
   if (typeof value === "string") return value ? 1 : 0
   if (Array.isArray(value)) return value.reduce<number>((total, entry) => total + countErrors(entry), 0)
   if (value && typeof value === "object") return Object.values(value).reduce<number>((total, entry) => total + countErrors(entry), 0)
   return 0
}

const navButtonClass =
   "inline-flex w-full items-center justify-center gap-2 rounded-full border border-border-subtle bg-surface px-5 py-2.5 text-sm font-bold text-navy-700 transition-colors hover:border-brand-400 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200 dark:hover:border-brand-500 dark:hover:text-brand-200 sm:w-auto"

export default function StepForm({
   steps,
   cancelHref,
   cancelLabel,
   submitLabel,
   submittingLabel,
   onSubmitAttempt,
}: StepFormProps) {
   const { errors, values, isSubmitting, submitCount, setTouched } = useFormikContext<FormikValues>()
   const prefersReduced = useReducedMotion()
   const headingId = useId()
   const rootRef = useRef<HTMLDivElement>(null)
   const firstRender = useRef(true)

   const [current, setCurrent] = useState(0)
   const [direction, setDirection] = useState(1)
   const scrolledSubmit = useRef(0)

   const last = steps.length - 1
   const active = Math.min(current, last)
   const step = steps[active]
   const total = steps.length
   const errorCounts = steps.map((entry) => {
      const bucket = errors as Record<string, unknown>
      return entry.errorKeys.reduce((count, key) => count + countErrors(bucket[key]), 0)
   })
   const activeErrors = errorCounts[active] ?? 0
   const percent = total > 0 ? Math.round(((active + 1) / total) * 100) : 0

   const valuesRef = useRef(values)
   const onSubmitAttemptRef = useRef(onSubmitAttempt)
   useEffect(() => {
      valuesRef.current = values
      onSubmitAttemptRef.current = onSubmitAttempt
   }, [values, onSubmitAttempt])

   // Submit can happen by click or Enter, so hook Formik's counter rather than the button.
   useEffect(() => {
      if (submitCount === 0) return
      onSubmitAttemptRef.current()
      void setTouched(touchTree(valuesRef.current) as unknown as FormikTouched<FormikValues>)
   }, [submitCount, setTouched])

   // A failed submit can leave the errors far above the current step; show the stepper.
   useEffect(() => {
      if (submitCount === 0 || isSubmitting || scrolledSubmit.current === submitCount) return
      const bucket = errors as Record<string, unknown>
      const hasErrors = steps.some((entry) => entry.errorKeys.some((key) => countErrors(bucket[key]) > 0))
      if (!hasErrors) return
      scrolledSubmit.current = submitCount
      rootRef.current?.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" })
   }, [submitCount, isSubmitting, errors, steps, prefersReduced])

   useEffect(() => {
      if (firstRender.current) {
         firstRender.current = false
         return
      }
      rootRef.current?.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" })
   }, [active, prefersReduced])

   if (!step) return null

   const goTo = (next: number) => {
      const target = Math.min(Math.max(next, 0), last)
      if (target === active) return
      setDirection(target > active ? 1 : -1)
      setCurrent(target)
   }

   const stepOf = fa.wizard.stepOf
      .replace("{current}", toPersianDigits(active + 1))
      .replace("{total}", toPersianDigits(total))
   const announcement = fa.wizard.stepAnnouncement
      .replace("{current}", toPersianDigits(active + 1))
      .replace("{total}", toPersianDigits(total))
      .replace("{title}", step.title)

   return (
      <div ref={rootRef} className="scroll-mt-24 space-y-4">
         <nav
            aria-label={fa.wizard.stepsLabel}
            className="relative overflow-hidden rounded-3xl border border-border-subtle bg-surface p-4 shadow-lg shadow-navy-900/5 sm:p-5 dark:shadow-black/20"
         >
            <div
               aria-hidden="true"
               className="pointer-events-none absolute -top-20 -end-12 h-40 w-40 rounded-full bg-brand-400/15 blur-3xl dark:bg-brand-500/10"
            />
            <div className="relative">
               <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-extrabold text-brand-700 dark:text-brand-200">{stepOf}</p>
                  <p className="text-xs font-bold text-navy-500 dark:text-navy-400">{toPersianDigits(percent)}٪</p>
               </div>

               <div
                  role="progressbar"
                  aria-label={fa.wizard.progressLabel}
                  aria-valuemin={1}
                  aria-valuemax={total}
                  aria-valuenow={active + 1}
                  aria-valuetext={stepOf}
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted dark:bg-navy-800"
               >
                  <motion.div
                     className="h-full rounded-full bg-linear-to-l from-brand-600 to-accent-500"
                     initial={false}
                     animate={{ width: `${percent}%` }}
                     transition={prefersReduced ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 28 }}
                  />
               </div>

               <ol className="mt-4 flex">
                  {steps.map((entry, index) => {
                     const isCompleted = index < active
                     const isCurrent = index === active
                     const hasError = errorCounts[index] > 0
                     const isReachable = isCompleted || (hasError && !isCurrent)
                     const circleClass = hasError
                        ? "border border-red-400 bg-red-50 text-red-600 ring-4 ring-red-500/15 dark:border-red-500/50 dark:bg-red-500/15 dark:text-red-200"
                        : isCurrent
                          ? "bg-linear-to-br from-brand-600 to-accent-600 text-white shadow-lg shadow-brand-700/25 ring-4 ring-brand-500/15"
                          : isCompleted
                            ? "bg-brand-600 text-white"
                            : "border border-border-strong bg-surface text-navy-500 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-400"

                     const circleContent = hasError ? (
                        <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
                     ) : isCompleted ? (
                        <CheckIcon className="h-4 w-4" aria-hidden="true" />
                     ) : (
                        <span aria-hidden="true">{toPersianDigits(index + 1)}</span>
                     )

                     return (
                        <li key={entry.id} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                           <div className="flex w-full items-center">
                              <span
                                 aria-hidden="true"
                                 className={`h-0.5 flex-1 transition-colors duration-500 ${
                                    index === 0 ? "bg-transparent" : index <= active ? "bg-brand-500" : "bg-border-subtle dark:bg-navy-700"
                                 }`}
                              />

                              {isReachable ? (
                                 <button
                                    type="button"
                                    onClick={() => goTo(index)}
                                    aria-label={(hasError ? fa.wizard.goToStep : fa.wizard.backToStep).replace("{title}", entry.title)}
                                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${circleClass}`}
                                 >
                                    {circleContent}
                                 </button>
                              ) : (
                                 <span
                                    aria-current={isCurrent ? "step" : undefined}
                                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${circleClass}`}
                                 >
                                    {circleContent}
                                 </span>
                              )}

                              <span
                                 aria-hidden="true"
                                 className={`h-0.5 flex-1 transition-colors duration-500 ${
                                    index === last ? "bg-transparent" : index < active ? "bg-brand-500" : "bg-border-subtle dark:bg-navy-700"
                                 }`}
                              />
                           </div>

                           <span
                              className={`sr-only max-w-full text-center text-[11px] leading-4 md:not-sr-only md:block md:truncate ${
                                 isCurrent
                                    ? "font-extrabold text-brand-700 dark:text-brand-200"
                                    : hasError
                                      ? "font-bold text-red-600 dark:text-red-300"
                                      : isCompleted
                                        ? "font-bold text-navy-600 dark:text-navy-300"
                                        : "font-medium text-navy-400 dark:text-navy-500"
                              }`}
                           >
                              {entry.title}
                           </span>
                        </li>
                     )
                  })}
               </ol>
            </div>
         </nav>

         <section className="relative rounded-3xl border border-border-subtle bg-surface shadow-xl shadow-navy-900/5 dark:shadow-black/20">
            <AnimatePresence mode="wait" initial={false}>
               <motion.div
                  key={step.id}
                  initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -36 * direction, scale: 0.99 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 36 * direction, scale: 0.99 }}
                  transition={{ duration: prefersReduced ? 0.01 : 0.26, ease: [0.22, 1, 0.36, 1] }}
               >
                  <header className="flex flex-col gap-3 border-b border-border-subtle p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
                     <div className="flex items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand-600 to-accent-600 text-white shadow-lg shadow-brand-700/20">
                           {step.icon}
                        </span>
                        <div className="min-w-0">
                           <p className="text-[11px] font-bold text-navy-500 dark:text-navy-400">{stepOf}</p>
                           <h2 id={headingId} className="mt-0.5 text-lg font-extrabold text-navy-950 sm:text-xl dark:text-white">
                              {step.title}
                           </h2>
                           {step.hint ? (
                              <p className="mt-1 text-xs leading-6 text-navy-500 dark:text-navy-400">{step.hint}</p>
                           ) : null}
                        </div>
                     </div>

                     {activeErrors > 0 ? (
                        <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-red-300 bg-red-50 px-3 py-1 text-[11px] font-bold text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                           <ExclamationTriangleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                           {fa.wizard.needsFix}
                        </span>
                     ) : null}
                  </header>

                  <div role="group" aria-labelledby={headingId} className="p-5 sm:p-7">
                     {step.content}
                  </div>
               </motion.div>
            </AnimatePresence>

            <footer className="flex flex-col-reverse gap-3 border-t border-border-subtle p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
               <Link
                  href={cancelHref}
                  className="inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-bold text-navy-600 transition-colors hover:bg-surface-muted dark:text-navy-300 dark:hover:bg-navy-800"
               >
                  {cancelLabel}
               </Link>

               <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                  <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} className={navButtonClass}>
                     <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                     {fa.wizard.previous}
                  </button>

                  {active === last ? (
                     <Button type="submit" disabled={isSubmitting} fullWidth={false} className="w-full sm:w-auto">
                        <span className="inline-flex items-center gap-2">
                           <CheckIcon className="h-4 w-4" aria-hidden="true" />
                           {isSubmitting ? submittingLabel : submitLabel}
                        </span>
                     </Button>
                  ) : (
                     <Button type="button" onClick={() => goTo(active + 1)} fullWidth={false} className="w-full sm:w-auto">
                        <span className="inline-flex items-center gap-2">
                           {fa.wizard.next}
                           <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
                        </span>
                     </Button>
                  )}
               </div>
            </footer>
         </section>

         <p className="sr-only" aria-live="polite">
            {announcement}
         </p>
      </div>
   )
}
