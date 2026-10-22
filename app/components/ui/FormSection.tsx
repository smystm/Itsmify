import type { ReactNode } from "react"

interface FormSectionProps {
   title: string
   hint?: string
   children: ReactNode
   className?: string
}

/** A logical group of fields separated from the next group by a light rule. */
export default function FormSection({ title, hint, children, className = "" }: FormSectionProps) {
   return (
      <section className={`rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 ${className}`}>
         <div className="mb-5 border-b border-border-subtle pb-4">
            <h2 className="text-base font-extrabold text-navy-950 dark:text-white">{title}</h2>
            {hint ? <p className="mt-1 text-xs leading-6 text-navy-500 dark:text-navy-400">{hint}</p> : null}
         </div>
         {children}
      </section>
   )
}
