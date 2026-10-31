"use client"

import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { ErrorMessage, useField } from "formik"
import { Popover } from "radix-ui"
import {
   CalendarDaysIcon,
   ChevronDoubleLeftIcon,
   ChevronDoubleRightIcon,
   ChevronLeftIcon,
   ChevronRightIcon,
} from "@heroicons/react/24/outline"
import {
   formatJalaliInput,
   isoToJalali,
   jalaliMonthLength,
   jalaliToGregorian,
   jalaliToIso,
   parseJalaliInput,
   todayIso,
   toPersianDigits,
} from "@/lib/date/jalali"
import FloatingLabel from "@/app/components/ui/FloatingLabel"
import { fa } from "@/lib/i18n/fa"

interface JalaliDateFieldProps {
   name: string
   label: string
   touched?: boolean
   error?: string
   className?: string
}

// The shared schemas only accept a real YYYY-MM-DD date. While the draft text
// is unparseable this impossible date keeps Formik/validation blocking submit;
// it is replaced as soon as the text parses and is never sent.
const INVALID_DATE = "0000-00-00"

const navButtonClass =
   "flex h-7 w-7 items-center justify-center rounded-lg text-navy-500 transition-colors hover:bg-surface-muted hover:text-brand-700 dark:text-navy-400 dark:hover:bg-navy-800 dark:hover:text-brand-200"

function currentView() {
   const today = isoToJalali(todayIso())
   return today ? { jy: today.jy, jm: today.jm } : { jy: 1400, jm: 1 }
}

function viewOf(value: string | null | undefined) {
   const date = isoToJalali(value)
   return date ? { jy: date.jy, jm: date.jm } : currentView()
}

function clampYear(year: number) {
   return Math.min(3177, Math.max(1, year))
}

export default function JalaliDateField({ name, label, touched, error, className = "" }: JalaliDateFieldProps) {
   const [field, , helpers] = useField<string>(name)
   const [text, setText] = useState(() => formatJalaliInput(field.value))
   const [open, setOpen] = useState(false)
   const [view, setView] = useState(() => viewOf(field.value))
   const valueRef = useRef(field.value)

   useEffect(() => {
      valueRef.current = field.value
   }, [field.value])

   // A hidden asset section (e.g. software dates after a type switch) must not
   // leave the invalid sentinel behind and block the whole submit.
   useEffect(() => {
      return () => {
         if (valueRef.current && !isoToJalali(valueRef.current)) {
            void helpers.setValue("")
         }
      }
   }, [helpers])

   const hasError = Boolean(touched && error)
   const selected = isoToJalali(field.value)
   const todayValue = todayIso()
   const today = isoToJalali(todayValue)

   const inputClass = [
      "w-full rounded-xl border border-navy-300 bg-surface py-4 pr-11 pl-4 text-sm text-navy-900 outline-none transition-all duration-200 placeholder:text-navy-500 hover:border-brand-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50 dark:placeholder:text-navy-400",
      hasError ? "border-red-500 ring-2 ring-red-500/15" : "",
   ]
      .filter(Boolean)
      .join(" ")

   const selectDate = (iso: string) => {
      void helpers.setValue(iso)
      setText(formatJalaliInput(iso))
      setOpen(false)
   }

   const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value
      setText(raw)

      if (!raw.trim()) {
         void helpers.setValue("")
         return
      }

      const iso = parseJalaliInput(raw)
      void helpers.setValue(iso ?? INVALID_DATE)
   }

   const shiftMonth = (delta: number) => {
      setView(({ jy, jm }) => {
         const next = jm + delta
         if (next < 1) return { jy: clampYear(jy - 1), jm: 12 }
         if (next > 12) return { jy: clampYear(jy + 1), jm: 1 }
         return { jy, jm: next }
      })
   }

   const shiftYear = (delta: number) => {
      setView(({ jy, jm }) => ({ jy: clampYear(jy + delta), jm }))
   }

   const first = jalaliToGregorian(view.jy, view.jm, 1)
   const offset = (new Date(Date.UTC(first.gy, first.gm - 1, first.gd)).getUTCDay() + 1) % 7
   const days = jalaliMonthLength(view.jy, view.jm)

   return (
      <div className={className || undefined}>
         <Popover.Root
            open={open}
            onOpenChange={(next) => {
               setOpen(next)
               if (next) setView(viewOf(field.value))
            }}
         >
            <Popover.Anchor asChild>
               <div className="relative">
                  <input
                     id={name}
                     name={name}
                     value={text}
                     onChange={handleChange}
                     onBlur={(event) => {
                        const iso = parseJalaliInput(text)
                        if (iso) setText(formatJalaliInput(iso))
                        field.onBlur(event)
                     }}
                     dir="ltr"
                     inputMode="numeric"
                     autoComplete="off"
                     maxLength={10}
                     placeholder={fa.datePicker.placeholder}
                     aria-invalid={hasError}
                     className={inputClass}
                  />

                  <Popover.Trigger asChild>
                     <button
                        type="button"
                        aria-label={fa.datePicker.open}
                        className="absolute inset-y-0 start-0 flex w-11 items-center justify-center rounded-s-xl text-navy-500 transition-colors hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-navy-400 dark:hover:text-brand-200"
                     >
                        <CalendarDaysIcon className="h-5 w-5" aria-hidden="true" />
                     </button>
                  </Popover.Trigger>

                  <FloatingLabel htmlFor={name} hasError={hasError}>
                     {label}
                  </FloatingLabel>
               </div>
            </Popover.Anchor>

            <Popover.Portal>
               <Popover.Content
                  dir="rtl"
                  align="start"
                  sideOffset={8}
                  collisionPadding={8}
                  role="dialog"
                  aria-label={label}
                  className="z-50 w-72 rounded-2xl border border-border-subtle bg-surface p-3 shadow-2xl shadow-navy-950/20 outline-none dark:border-navy-700 dark:bg-navy-900"
               >
                  <div className="mb-2 flex items-center justify-between gap-1">
                     <div className="flex items-center">
                        <button type="button" aria-label={fa.datePicker.previousYear} onClick={() => shiftYear(-1)} className={navButtonClass}>
                           <ChevronDoubleRightIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button type="button" aria-label={fa.datePicker.previousMonth} onClick={() => shiftMonth(-1)} className={navButtonClass}>
                           <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                     </div>

                     <p className="text-sm font-extrabold text-navy-900 dark:text-navy-50">
                        {fa.datePicker.months[view.jm - 1]} {toPersianDigits(view.jy)}
                     </p>

                     <div className="flex items-center">
                        <button type="button" aria-label={fa.datePicker.nextMonth} onClick={() => shiftMonth(1)} className={navButtonClass}>
                           <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button type="button" aria-label={fa.datePicker.nextYear} onClick={() => shiftYear(1)} className={navButtonClass}>
                           <ChevronDoubleLeftIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                     </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-navy-400 dark:text-navy-500">
                     {fa.datePicker.weekdays.map((day) => (
                        <span key={day}>{day}</span>
                     ))}
                  </div>

                  <div className="mt-1 grid grid-cols-7 gap-1">
                     {Array.from({ length: offset }, (_, index) => (
                        <span key={`empty-${index}`} />
                     ))}

                     {Array.from({ length: days }, (_, index) => {
                        const day = index + 1
                        const isSelected = selected !== null && selected.jy === view.jy && selected.jm === view.jm && selected.jd === day
                        const isToday = today !== null && today.jy === view.jy && today.jm === view.jm && today.jd === day

                        return (
                           <button
                              key={day}
                              type="button"
                              onClick={() => selectDate(jalaliToIso(view.jy, view.jm, day))}
                              aria-pressed={isSelected}
                              aria-current={isToday ? "date" : undefined}
                              aria-label={`${toPersianDigits(day)} ${fa.datePicker.months[view.jm - 1]} ${toPersianDigits(view.jy)}`}
                              className={`flex h-9 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                                 isSelected
                                    ? "bg-brand-600 text-white shadow-sm"
                                    : isToday
                                      ? "border border-brand-400 text-brand-700 dark:text-brand-200"
                                      : "text-navy-700 hover:bg-surface-muted dark:text-navy-200 dark:hover:bg-navy-800"
                              }`}
                           >
                              {toPersianDigits(day)}
                           </button>
                        )
                     })}
                  </div>

                  <div className="mt-2 border-t border-border-subtle pt-2 dark:border-navy-700">
                     <button
                        type="button"
                        onClick={() => selectDate(todayValue)}
                        className="w-full rounded-lg px-3 py-2 text-xs font-bold text-brand-700 transition-colors hover:bg-surface-muted dark:text-brand-200 dark:hover:bg-navy-800"
                     >
                        {fa.datePicker.today}
                     </button>
                  </div>
               </Popover.Content>
            </Popover.Portal>
         </Popover.Root>

         <ErrorMessage name={name} component="p" className="mt-1.5 text-[11px] font-medium leading-5 text-red-600 dark:text-red-400" />
      </div>
   )
}
