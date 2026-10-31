import type { ReactNode } from "react"

/**
 * Shared outlined-field label. The surface background creates the notch in the
 * control border; `start-*` keeps it on the correct side in RTL and LTR.
 */
export function floatingLabelClass(hasError = false) {
   return [
      "absolute start-4 top-0 z-10 max-w-[calc(100%-1.5rem)] -translate-y-1/2 truncate rounded bg-surface px-1.5 text-xs font-bold leading-4",
      hasError ? "text-red-600 dark:text-red-400" : "text-navy-600 dark:text-navy-300",
   ].join(" ")
}

interface FloatingLabelProps {
   htmlFor?: string
   id?: string
   hasError?: boolean
   children: ReactNode
}

export default function FloatingLabel({ htmlFor, id, hasError = false, children }: FloatingLabelProps) {
   return (
      <label htmlFor={htmlFor} id={id} className={floatingLabelClass(hasError)}>
         {children}
      </label>
   )
}
