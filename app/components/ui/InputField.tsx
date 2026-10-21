import { Field, ErrorMessage } from "formik"
import type { ReactNode } from "react"

interface InputFieldProps {
   name: string
   label: string
   type?: React.HTMLInputTypeAttribute | "text"
   placeholder?: string
   autoComplete?: string
   touched?: boolean
   error?: string
   className?: string
   /** Optional leading glyph, e.g. a phone or user icon. */
   icon?: ReactNode
   /** Helper line under the label, above the input (e.g. username charset hint). */
   hint?: string
   /** Text direction for the input itself (e.g. LTR usernames inside the RTL page). */
   dir?: "ltr" | "rtl" | "auto"
}

const baseInputClass =
   "w-full rounded-xl border border-navy-300 bg-surface text-sm text-navy-900 outline-none transition-all duration-200 placeholder:text-navy-500 hover:border-brand-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50 dark:placeholder:text-navy-400"

export default function InputField({
   name,
   label,
   type = "text",
   placeholder,
   autoComplete,
   touched,
   error,
   className = "",
   icon,
   hint,
   dir,
}: InputFieldProps) {
   const hasError = Boolean(touched && error)

   const inputClass = [
      baseInputClass,
      // `ps-*` is logical, so the slot stays on the right in RTL.
      icon ? "py-3 pr-11 pl-4" : "px-4 py-3",
      hasError ? "border-red-500 ring-2 ring-red-500/15" : "",
   ]
      .filter(Boolean)
      .join(" ")

   return (
      <div className={className || undefined}>
         <label htmlFor={name} className="mb-1.5 block text-sm font-bold text-navy-800 dark:text-navy-200">
            {label}
         </label>

         {hint && !hasError ? <p className="mb-1.5 text-xs text-navy-500 dark:text-navy-400">{hint}</p> : null}

         <div className="relative">
            {icon ? (
               <span className="pointer-events-none absolute inset-y-0 inset-start-0 flex w-11 items-center justify-center text-navy-500 dark:text-navy-400">
                  {icon}
               </span>
            ) : null}
            <Field
               id={name}
               name={name}
               type={type}
               placeholder={placeholder}
               autoComplete={autoComplete}
               dir={dir}
               className={inputClass}
            />
         </div>

         <ErrorMessage name={name} component="p" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400" />
      </div>
   )
}
