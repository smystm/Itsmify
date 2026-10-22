"use client"

interface FilterOption {
   value: string
   label: string
}

interface FilterSelectProps {
   label: string
   value: string
   onChange: (value: string) => void
   options: FilterOption[]
   className?: string
}

/** Compact native select used in the list filter bars. */
export default function FilterSelect({ label, value, onChange, options, className = "" }: FilterSelectProps) {
   return (
      <label className={`inline-flex min-w-0 flex-col gap-1 text-[11px] font-bold text-navy-500 dark:text-navy-400 ${className}`.trim()}>
         {label}
         <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="rounded-full border border-border-subtle bg-surface px-3 py-2 text-xs font-bold text-navy-800 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-100"
         >
            {options.map((option) => (
               <option key={option.value} value={option.value}>
                  {option.label}
               </option>
            ))}
         </select>
      </label>
   )
}
