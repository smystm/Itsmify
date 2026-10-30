"use client"

import { useEffect, useRef, useState } from "react"

interface FilterOption {
   value: string
   label: string
}

interface FilterSelectProps {
   label: string
   value: string
   onChange: (value: string) => void
   options: FilterOption[]
   className?: string
}

export default function FilterSelect({
   label,
   value,
   onChange,
   options,
   className = "",
}: FilterSelectProps) {
   const [isOpen, setIsOpen] = useState(false)
   const containerRef = useRef<HTMLDivElement>(null)

   const selectedOption = options.find((option) => option.value === value)

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (
            containerRef.current &&
            !containerRef.current.contains(event.target as Node)
         ) {
            setIsOpen(false)
         }
      }

      const handleEscape = (event: KeyboardEvent) => {
         if (event.key === "Escape") setIsOpen(false)
      }

      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)

      return () => {
         document.removeEventListener("mousedown", handleClickOutside)
         document.removeEventListener("keydown", handleEscape)
      }
   }, [])

   return (
      <div
         ref={containerRef}
         className={`inline-flex min-w-0 flex-col gap-1 text-[11px] font-bold text-navy-500 dark:text-navy-400 ${className}`.trim()}
      >
         <span>{label}</span>

         <div className="relative">
            {/* Trigger */}
            <button
               type="button"
               aria-haspopup="listbox"
               aria-expanded={isOpen}
               onClick={() => setIsOpen((prev) => !prev)}
               className={`
                  flex w-full min-w-0 items-center justify-between gap-3
                  rounded-full border bg-surface
                  py-2 pr-3 pl-9 text-xs font-bold
                  outline-none transition-all duration-200
                  ${
                     isOpen
                        ? "border-brand-500 ring-4 ring-brand-500/15"
                        : "border-border-subtle hover:border-brand-400"
                  }
                  text-navy-800
                  dark:bg-navy-900 dark:text-navy-100
                  dark:border-navy-700
                  dark:hover:border-brand-500
               `}
            >
               <span className="truncate">
                  {selectedOption?.label ?? "انتخاب کنید"}
               </span>

               <svg
                  className={`
                     absolute left-3 h-3.5 w-3.5 shrink-0
                     text-navy-400 transition-transform duration-200
                     dark:text-navy-500
                     ${isOpen ? "rotate-180 text-brand-500" : ""}
                  `}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
               >
                  <path d="m6 9 6 6 6-6" />
               </svg>
            </button>

            {/* Dropdown */}
            <div
               className={`
                  absolute start-0 top-full z-50 mt-2 w-max min-w-full max-w-[calc(100vw-2rem)]
                  origin-top overflow-hidden rounded-2xl
                  border border-border-subtle
                  bg-surface p-1.5 shadow-xl shadow-navy-900/10
                  dark:border-navy-700 dark:bg-navy-900
                  transition-all duration-200 ease-out
                  ${
                     isOpen
                        ? "visible translate-y-0 scale-100 opacity-100"
                        : "invisible -translate-y-2 scale-[0.98] opacity-0 pointer-events-none"
                  }
               `}
               role="listbox"
            >
               <div className="max-h-56 overflow-y-auto">
                  {options.map((option) => {
                     const isSelected = option.value === value

                     return (
                        <button
                           key={option.value}
                           type="button"
                           role="option"
                           aria-selected={isSelected}
                           onClick={() => {
                              onChange(option.value)
                              setIsOpen(false)
                           }}
                           className={`
                              flex w-full items-center justify-between
                              gap-3 rounded-xl px-3 py-2.5
                              text-start text-xs font-semibold
                              transition-colors duration-150
                              ${
                                 isSelected
                                    ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                                    : "text-navy-700 hover:bg-navy-100 dark:text-navy-200 dark:hover:bg-navy-800"
                              }
                           `}
                        >
                           <span className="truncate">{option.label}</span>

                           {isSelected && (
                              <svg
                                 className="h-4 w-4 shrink-0 text-brand-500"
                                 viewBox="0 0 24 24"
                                 fill="none"
                                 stroke="currentColor"
                                 strokeWidth="2.5"
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 aria-hidden="true"
                              >
                                 <path d="m5 12 4 4L19 6" />
                              </svg>
                           )}
                        </button>
                     )
                  })}
               </div>
            </div>
         </div>
      </div>
   )
}
