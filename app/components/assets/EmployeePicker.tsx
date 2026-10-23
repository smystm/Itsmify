"use client"

import { useEffect, useState } from "react"
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { getJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import type { EmployeeLookupDto } from "@/lib/employees/types"

interface EmployeePickerProps {
   value: string
   onChange: (employee: EmployeeLookupDto | null) => void
   disabled?: boolean
   placeholder?: string
}

/**
 * Searchable employee picker backed by the lightweight lookup endpoint.
 * Asset managers only need a name and a profile id, not the full HR record.
 */
export default function EmployeePicker({
   value,
   onChange,
   disabled = false,
   placeholder = fa.assets.assign.employeeSearch,
}: EmployeePickerProps) {
   const [query, setQuery] = useState("")
   const [debounced, setDebounced] = useState("")
   const [employees, setEmployees] = useState<EmployeeLookupDto[]>([])
   const [selectedState, setSelected] = useState<EmployeeLookupDto | null>(null)
   const [loading, setLoading] = useState(false)
   const [error, setError] = useState<string | null>(null)

   // A selection is only valid while the parent still holds its profile id.
   // This keeps an external form reset from leaving a stale chip on screen.
   const selected = selectedState && selectedState.profileId === value ? selectedState : null

   useEffect(() => {
      const timer = window.setTimeout(() => setDebounced(query), 250)
      return () => window.clearTimeout(timer)
   }, [query])

   useEffect(() => {
      const controller = new AbortController()
      const params = new URLSearchParams()
      if (debounced.trim()) params.set("q", debounced.trim())
      void getJson<{ employees: EmployeeLookupDto[] }>(
         `/api/admin/employees/lookup?${params.toString()}`,
         controller.signal,
      )
         .then((result) => setEmployees(result.employees))
         .catch((err) => {
            if (controller.signal.aborted) return
            console.error("employee lookup failed", err)
            setError(fa.employees.loadError)
         })
         .finally(() => {
            if (!controller.signal.aborted) setLoading(false)
         })
      return () => controller.abort()
   }, [debounced])

   if (selected) {
      return (
         <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-300 bg-brand-50/60 px-4 py-3 dark:border-brand-500/30 dark:bg-brand-500/10">
            <div className="min-w-0">
               <p className="truncate text-sm font-extrabold text-navy-900 dark:text-white">
                  {selected.firstName} {selected.lastName}
               </p>
               <p className="mt-0.5 truncate text-xs text-navy-500 dark:text-navy-300">
                  {selected.personnelCode ?? selected.username}
                  {selected.orgUnit ? ` · ${selected.orgUnit.name}` : ""}
               </p>
            </div>
            {!disabled ? (
               <button
                  type="button"
                  onClick={() => {
                     setSelected(null)
                     setQuery("")
                     onChange(null)
                  }}
                  aria-label={fa.common.clear}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-navy-500 transition-colors hover:bg-surface hover:text-navy-800 dark:text-navy-300 dark:hover:bg-navy-800 dark:hover:text-white"
               >
                  <XMarkIcon className="h-4 w-4" aria-hidden="true" />
               </button>
            ) : null}
         </div>
      )
   }

   return (
      <div className="relative">
         <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 inset-s-3 top-0 flex w-6 items-center justify-center text-navy-500"
         >
            <MagnifyingGlassIcon className="h-5 w-5" />
         </span>
         <input
            type="search"
            value={query}
            disabled={disabled}
            onChange={(event) => {
               setQuery(event.target.value)
               setLoading(true)
               setError(null)
            }}
            placeholder={placeholder}
            className="w-full ps-10 rounded-full border border-border-subtle bg-surface px-4 pe-11 py-2.5 text-sm font-medium text-navy-800 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:opacity-60 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
         />

         {query || loading ? (
            <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-border-subtle bg-surface p-2 shadow-2xl shadow-navy-950/20 dark:border-navy-700 dark:bg-navy-900">
               {loading ? (
                  <p className="px-3 py-2 text-xs text-navy-500 dark:text-navy-400">{fa.common.loading}</p>
               ) : error ? (
                  <p className="px-3 py-2 text-xs font-bold text-red-600 dark:text-red-300">{error}</p>
               ) : employees.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-navy-500 dark:text-navy-400">{fa.assets.assign.noEmployees}</p>
               ) : (
                  employees.map((employee) => (
                     <button
                        key={employee.profileId}
                        type="button"
                        onClick={() => {
                           setSelected(employee)
                           setQuery("")
                           onChange(employee)
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-right transition-colors hover:bg-surface-muted dark:hover:bg-navy-800"
                     >
                        <span className="min-w-0">
                           <span className="block truncate text-sm font-bold text-navy-900 dark:text-white">
                              {employee.firstName} {employee.lastName}
                           </span>
                           <span className="mt-0.5 block truncate text-xs text-navy-500 dark:text-navy-400">
                              {employee.personnelCode ?? employee.username}
                              {employee.orgUnit ? ` · ${employee.orgUnit.name}` : ""}
                           </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-surface-muted px-2 py-1 text-[10px] font-bold text-navy-600 dark:bg-navy-800 dark:text-navy-300">
                           {fa.employees.assetsCount.replace("{count}", employee.activeAssetCount.toLocaleString("fa-IR"))}
                        </span>
                     </button>
                  ))
               )}
            </div>
         ) : null}

         {value ? (
            <p className="mt-1.5 text-[11px] text-navy-500 dark:text-navy-400">{fa.assets.assign.employee}</p>
         ) : null}
      </div>
   )
}
