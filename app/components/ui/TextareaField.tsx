"use client"

import { ErrorMessage, Field } from "formik"
import FloatingLabel from "@/app/components/ui/FloatingLabel"

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
         <div className="relative">
            <Field
               as="textarea"
               id={name}
               name={name}
               rows={rows}
               placeholder={placeholder}
               className={`w-full resize-y rounded-xl border bg-surface px-3.5 py-4 text-sm leading-6 text-navy-900 outline-none transition-all duration-200 placeholder:text-navy-500 hover:border-brand-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:bg-navy-900 dark:text-navy-50 dark:placeholder:text-navy-400 ${
                  hasError ? "border-red-500 ring-2 ring-red-500/15" : "border-navy-300 dark:border-navy-700"
               }`}
            />
            <FloatingLabel htmlFor={name} hasError={hasError}>
               {label}
            </FloatingLabel>
         </div>
         {hint && !hasError ? <p className="mt-1.5 text-[11px] leading-5 text-navy-500 dark:text-navy-400">{hint}</p> : null}
         <ErrorMessage name={name} component="p" className="mt-1.5 text-[11px] font-medium leading-5 text-red-600 dark:text-red-400" />
      </div>
   )
}
