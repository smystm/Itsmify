"use client"

import { useEffect, useId, type ReactNode } from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { fa } from "@/lib/i18n/fa"

interface ModalProps {
   title: string
   description?: string
   children: ReactNode
   onClose: () => void
   wide?: boolean
   extraWide?: boolean
}

/**
 * Shared accessible dialog. The admin panels own their form/confirm content;
 * this component only provides the backdrop, title wiring, escape handling and
 * scroll lock so every modal behaves the same.
 */
export default function Modal({ title, description, children, onClose, wide = false, extraWide = false }: ModalProps) {
   const titleId = useId()

   useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
         if (event.key === "Escape") onClose()
      }
      document.addEventListener("keydown", onKeyDown)
      const previous = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
         document.removeEventListener("keydown", onKeyDown)
         document.body.style.overflow = previous
      }
   }, [onClose])

   return (
      <div
         className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 backdrop-blur-sm sm:items-center"
         role="presentation"
         onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
         }}
      >
         <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`my-8 w-full ${extraWide ? "max-w-4xl" : wide ? "max-w-2xl" : "max-w-md"} rounded-3xl border border-border-subtle bg-surface p-6 shadow-2xl shadow-navy-950/30 dark:border-navy-700 dark:bg-navy-900 sm:p-8`}
         >
            <div className="mb-5 flex items-start justify-between gap-4">
               <div>
                  <h2 id={titleId} className="text-xl font-extrabold text-navy-950 dark:text-white">
                     {title}
                  </h2>
                  {description ? (
                     <p className="mt-1.5 text-sm leading-6 text-navy-600 dark:text-navy-300">{description}</p>
                  ) : null}
               </div>
               <button
                  type="button"
                  onClick={onClose}
                  aria-label={fa.admin.close}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-navy-500 transition-colors hover:bg-surface-muted hover:text-navy-800 dark:text-navy-300 dark:hover:bg-navy-800 dark:hover:text-white"
               >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
               </button>
            </div>

            {children}
         </div>
      </div>
   )
}
