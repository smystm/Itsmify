"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import { fa } from "@/lib/i18n/fa"

interface PaginationProps {
   page: number
   totalPages: number
   onPage: (page: number) => void
   disabled?: boolean
}

export default function Pagination({ page, totalPages, onPage, disabled = false }: PaginationProps) {
   if (totalPages <= 0) return null
   return (
      <nav className="flex flex-wrap items-center justify-between gap-3" aria-label={fa.employees.pageOf.replace("{page}", String(page)).replace("{pages}", String(totalPages))}>
         <p className="text-xs font-medium text-navy-500 dark:text-navy-400">
            {fa.employees.pageOf.replace("{page}", page.toLocaleString("fa-IR")).replace("{pages}", totalPages.toLocaleString("fa-IR"))}
         </p>
         <div className="flex items-center gap-2">
            <button
               type="button"
               disabled={disabled || page <= 1}
               onClick={() => onPage(page - 1)}
               className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-xs font-bold text-navy-700 transition-colors hover:border-brand-400 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200"
            >
               <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
               {fa.employees.previous}
            </button>
            <button
               type="button"
               disabled={disabled || page >= totalPages}
               onClick={() => onPage(page + 1)}
               className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-xs font-bold text-navy-700 transition-colors hover:border-brand-400 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200"
            >
               {fa.employees.next}
               <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </button>
         </div>
      </nav>
   )
}
