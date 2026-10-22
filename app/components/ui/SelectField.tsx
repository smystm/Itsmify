"use client"

import { ErrorMessage, Field, useFormikContext } from "formik"
import type { ReactNode } from "react"

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

const baseClass =
   "w-full rounded-xl border border-navy-300 bg-surface px-4 py-3 text-sm font-bold text-navy-900 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"

export default function SelectField({
   name,
   label,
   options,
   placeholder,
   hint,
   disabled = false,
   touched,
   error,
   className = "",
   children,
   onChange,
}: SelectFieldProps) {
   const hasError = Boolean(touched && error)
   const { setFieldValue } = useFormikContext()
   return (
      <div className={className || undefined}>
         <label htmlFor={name} className="mb-1.5 block min-h-10 text-sm font-bold leading-5 text-navy-800 dark:text-navy-200">
            {label}
         </label>
         {hint && !hasError ? <p className="mb-1.5 text-xs leading-5 text-navy-500 dark:text-navy-400">{hint}</p> : null}
         <Field
            as="select"
            id={name}
            name={name}
            disabled={disabled}
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
               void setFieldValue(name, event.target.value)
               onChange?.(event.target.value)
            }}
            className={`${baseClass} ${hasError ? "border-red-500 ring-2 ring-red-500/15" : ""}`.trim()}
         >
            {placeholder ? <option value="">{placeholder}</option> : null}
            {children}
            {options.map((option) => (
               <option key={option.value} value={option.value}>
                  {option.label}
               </option>
            ))}
         </Field>
         {hint && !hasError ? <p className="mt-1.5 text-xs leading-5 text-navy-500 dark:text-navy-400">{hint}</p> : null}
         <ErrorMessage name={name} component="p" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400" />
      </div>
   )
}
