"use client"

import { ErrorMessage, Field } from "formik"

interface TextareaFieldProps {
   name: string
   label: string
   placeholder?: string
   hint?: string
   rows?: number
   touched?: boolean
   error?: string
   className?: string
}

export default function TextareaField({
   name,
   label,
   placeholder,
   hint,
   rows = 3,
   touched,
   error,
   className = "",
}: TextareaFieldProps) {
   const hasError = Boolean(touched && error)
   return (
      <div className={className || undefined}>
         <label htmlFor={name} className="mb-1.5 block min-h-10 text-sm font-bold leading-5 text-navy-800 dark:text-navy-200">
            {label}
         </label>
         {hint && !hasError ? <p className="mt-1.5 text-xs leading-5 text-navy-500 dark:text-navy-400">{hint}</p> : null}
         <Field
            as="textarea"
            id={name}
            name={name}
            rows={rows}
            placeholder={placeholder}
            className={`w-full resize-y rounded-xl border bg-surface px-4 py-3 text-sm leading-6 text-navy-900 outline-none transition-all duration-200 placeholder:text-navy-500 hover:border-brand-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:bg-navy-900 dark:text-navy-50 dark:placeholder:text-navy-400 ${
               hasError ? "border-red-500 ring-2 ring-red-500/15" : "border-navy-300 dark:border-navy-700"
            }`}
         />
         <ErrorMessage name={name} component="p" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400" />
      </div>
   )
}
