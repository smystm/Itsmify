"use client"

import { useState } from "react"
import { Field, ErrorMessage } from "formik"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { fa } from "@/lib/i18n/fa"

interface PasswordFieldProps {
   name: string
   label: string
   autoComplete?: string
   placeholder?: string
   touched?: boolean
   error?: string
   hint?: string
   className?: string
}

/**
 * Password input with a reveal toggle. Rendered LTR because passwords are
 * ASCII in practice and an RTL field would put the cursor at the "wrong" end.
 */
export default function PasswordField({
   name,
   label,
   autoComplete = "current-password",
   placeholder,
   touched,
   error,
   hint,
   className = "",
}: PasswordFieldProps) {
   const [visible, setVisible] = useState(false)
   const hasError = Boolean(touched && error)

   return (
      <div className={className || undefined}>
         <label htmlFor={name} className="mb-1.5 block text-sm font-bold text-navy-800 dark:text-navy-200">
            {label}
         </label>

         {hint && !hasError ? <p className="mb-1.5 text-xs text-navy-500 dark:text-navy-400">{hint}</p> : null}

         <div className="relative">
            <Field
               id={name}
               name={name}
               type={visible ? "text" : "password"}
               placeholder={placeholder}
               autoComplete={autoComplete}
               dir="ltr"
               className={`w-full rounded-xl border bg-surface px-4 py-3 pe-12 text-sm text-navy-900 outline-none transition-all duration-200 placeholder:text-navy-500 hover:border-brand-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:bg-navy-900 dark:text-navy-50 dark:placeholder:text-navy-400 ${
                  hasError
                     ? "border-red-500 ring-2 ring-red-500/15"
                     : "border-navy-300 dark:border-navy-700"
               }`}
            />

            <button
               type="button"
               onClick={() => setVisible((current) => !current)}
               aria-label={visible ? fa.common.hidePassword : fa.common.showPassword}
               aria-pressed={visible}
               className="absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-xl text-navy-500 transition-colors hover:text-brand-700 dark:text-navy-400 dark:hover:text-brand-200"
            >
               {visible ? <EyeSlashIcon className="h-5 w-5" aria-hidden="true" /> : <EyeIcon className="h-5 w-5" aria-hidden="true" />}
            </button>
         </div>

         <ErrorMessage name={name} component="p" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400" />
      </div>
   )
}
