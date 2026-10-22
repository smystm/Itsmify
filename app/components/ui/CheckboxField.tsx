"use client"

import { ErrorMessage, Field } from "formik"

interface CheckboxFieldProps {
   name: string
   label: string
   hint?: string
   disabled?: boolean
}

export default function CheckboxField({ name, label, hint, disabled = false }: CheckboxFieldProps) {
   return (
      <div>
         <label
            htmlFor={name}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm font-bold text-navy-800 transition-colors hover:border-brand-400 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-100"
         >
            <Field
               id={name}
               name={name}
               type="checkbox"
               disabled={disabled}
               className="mt-0.5 h-4 w-4 rounded border-navy-300 text-brand-700 focus:ring-brand-500 dark:border-navy-600 dark:bg-navy-800"
            />
            <span>
               {label}
               {hint ? <span className="mt-1 block text-xs font-normal leading-5 text-navy-500 dark:text-navy-400">{hint}</span> : null}
            </span>
         </label>
         <ErrorMessage name={name} component="p" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400" />
      </div>
   )
}
