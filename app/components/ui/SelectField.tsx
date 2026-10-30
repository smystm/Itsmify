"use client"

import { ErrorMessage, useFormikContext } from "formik"
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react"

export interface SelectOption {
   value: string
   label: string
}

interface SelectFieldProps {
   name: string
   label: string
   options: SelectOption[]
   placeholder?: string
   hint?: string
   disabled?: boolean
   touched?: boolean
   error?: string
   className?: string
   children?: ReactNode
   onChange?: (value: string) => void
}

export default function SelectField({ name, label, options, placeholder, hint, disabled = false, touched, error, className = "", children, onChange }: SelectFieldProps) {
   const { values, setFieldValue } = useFormikContext<Record<string, string>>()

   const [isOpen, setIsOpen] = useState(false)
   const [activeIndex, setActiveIndex] = useState(0)

   const containerRef = useRef<HTMLDivElement>(null)
   const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

   const value = values[name] ?? ""
   const hasError = Boolean(touched && error)

   const selectedOption = options.find((option) => option.value === value)

   const displayLabel = selectedOption?.label ?? (value || placeholder || "انتخاب کنید")

   const selectOption = (option: SelectOption) => {
      void setFieldValue(name, option.value)
      onChange?.(option.value)
      setIsOpen(false)
   }

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsOpen(false)
         }
      }

      const handleEscape = (event: globalThis.KeyboardEvent) => {
         if (event.key === "Escape") setIsOpen(false)
      }

      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)

      return () => {
         document.removeEventListener("mousedown", handleClickOutside)
         document.removeEventListener("keydown", handleEscape)
      }
   }, [])

   useEffect(() => {
      if (isOpen) {
         optionRefs.current[activeIndex]?.scrollIntoView({
            block: "nearest",
         })
      }
   }, [activeIndex, isOpen])

   const openList = () => {
      const selectedIndex = options.findIndex((option) => option.value === value)
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
      setIsOpen(true)
   }

   const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return

      if (!isOpen) {
         if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            openList()
         }
         return
      }

      switch (event.key) {
         case "ArrowDown":
            event.preventDefault()
            setActiveIndex((prev) => Math.min(prev + 1, options.length - 1))
            break

         case "ArrowUp":
            event.preventDefault()
            setActiveIndex((prev) => Math.max(prev - 1, 0))
            break

         case "Home":
            event.preventDefault()
            setActiveIndex(0)
            break

         case "End":
            event.preventDefault()
            setActiveIndex(options.length - 1)
            break

         case "Enter":
         case " ":
            event.preventDefault()
            if (options[activeIndex]) {
               selectOption(options[activeIndex])
            }
            break

         case "Escape":
            event.preventDefault()
            setIsOpen(false)
            break
      }
   }

   return (
      <div className={className || undefined}>
         <label id={`${name}-label`} className="mb-1.5 block min-h-10 text-sm font-bold leading-5 text-navy-800 dark:text-navy-200">
            {label}
         </label>

         <div ref={containerRef} className="relative">
            {/* Trigger */}
            <button
               type="button"
               disabled={disabled}
               aria-labelledby={`${name}-label`}
               aria-haspopup="listbox"
               aria-expanded={isOpen}
               aria-describedby={hasError ? `${name}-error` : hint ? `${name}-hint` : undefined}
               onClick={() => (isOpen ? setIsOpen(false) : openList())}
               onKeyDown={handleKeyDown}
               className={`
                  relative flex w-full items-center justify-between
                  rounded-xl border bg-surface py-3 pl-10 pr-4
                  text-sm font-bold text-navy-900 outline-none
                  transition-all duration-200
                  disabled:cursor-not-allowed disabled:opacity-60
                  dark:bg-navy-900 dark:text-navy-50

                  ${hasError ? "border-red-500 ring-2 ring-red-500/15" : isOpen ? "border-brand-500 ring-4 ring-brand-500/15" : "border-navy-300 hover:border-brand-400 dark:border-navy-700"}
               `}
            >
               <span className={`truncate ${!selectedOption && !value ? "text-navy-400 dark:text-navy-500" : ""}`}>{displayLabel}</span>

               <svg
                  className={`
                     absolute left-3 h-4 w-4 shrink-0
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
                  absolute left-0 top-full z-50 mt-2 w-full
                  origin-top overflow-hidden rounded-xl
                  border border-navy-200 bg-surface p-1.5
                  shadow-xl shadow-navy-900/10
                  transition-all duration-200 ease-out
                  dark:border-navy-700 dark:bg-navy-900

                  ${isOpen ? "visible translate-y-0 scale-100 opacity-100" : "invisible pointer-events-none -translate-y-2 scale-[0.98] opacity-0"}
               `}
               role="listbox"
               aria-labelledby={`${name}-label`}
            >
               <div className="max-h-60 overflow-y-auto">
                  {placeholder && (
                     <button
                        type="button"
                        role="option"
                        aria-selected={!value}
                        onClick={() => selectOption({ value: "", label: placeholder })}
                        className={`
                           flex w-full items-center justify-between
                           rounded-lg px-3 py-2.5 text-sm font-medium
                           transition-colors
                           ${!value ? "bg-brand-500/10 text-brand-600 dark:text-brand-400" : "text-navy-500 hover:bg-navy-100 dark:text-navy-400 dark:hover:bg-navy-800"}
                        `}
                     >
                        <span>{placeholder}</span>
                     </button>
                  )}

                  {options.map((option, index) => {
                     const isSelected = option.value === value
                     const isActive = index === activeIndex

                     return (
                        <button
                           key={option.value}
                           ref={(element) => {
                              optionRefs.current[index] = element
                           }}
                           type="button"
                           role="option"
                           aria-selected={isSelected}
                           onClick={() => selectOption(option)}
                           onMouseEnter={() => setActiveIndex(index)}
                           className={`
                              flex w-full items-center justify-between
                              gap-3 rounded-lg px-3 py-2.5
                              text-sm font-semibold
                              transition-colors duration-150
                              ${
                                 isSelected
                                    ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                                    : isActive
                                      ? "bg-navy-100 text-navy-900 dark:bg-navy-800 dark:text-navy-100"
                                      : "text-navy-700 dark:text-navy-200"
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

                  {children}
               </div>
            </div>
         </div>

         {hint && !hasError && (
            <p id={`${name}-hint`} className="mt-1.5 text-xs leading-5 text-navy-500 dark:text-navy-400">
               {hint}
            </p>
         )}

         <ErrorMessage
            name={name}
            render={(message) => (
               <p id={`${name}-error`} className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                  {message}
               </p>
            )}
         />
      </div>
   )
}
