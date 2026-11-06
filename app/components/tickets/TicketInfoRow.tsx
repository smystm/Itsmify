import type { ReactNode } from "react"

interface TicketInfoRowProps {
   label: string
   value: ReactNode
   ltr?: boolean
}

export default function TicketInfoRow({ label, value, ltr = false }: TicketInfoRowProps) {
   return (
      <div>
         <dt className="text-[11px] font-bold text-navy-500 dark:text-navy-400">{label}</dt>
         <dd
            dir={ltr ? "ltr" : undefined}
            className={`mt-1 text-sm font-bold text-navy-900 dark:text-navy-100 ${ltr ? "text-start font-mono" : ""}`.trim()}
         >
            {value || "—"}
         </dd>
      </div>
   )
}
