"use client"

import { useEffect, useId, useState } from "react"
import {
   BuildingOffice2Icon,
   HomeModernIcon,
   MagnifyingGlassIcon,
   MapPinIcon,
   Squares2X2Icon,
   XMarkIcon,
} from "@heroicons/react/24/outline"
import { floatingLabelClass } from "@/app/components/ui/FloatingLabel"
import { getJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import type { EmployeeLookupDto } from "@/lib/employees/types"

interface EmployeePickerProps {
   value: string
   onChange: (employee: EmployeeLookupDto | null) => void
   disabled?: boolean
   placeholder?: string
   /** Outlined-field label shown on the search input or selected card. */
   label?: string
   /** Restores the chip after the step unmounts and remounts. */
   initial?: EmployeeLookupDto | null
}

function initialsOf(employee: EmployeeLookupDto) {
   return `${employee.firstName.trim().charAt(0)}${employee.lastName.trim().charAt(0)}`.trim()
}

function EmployeeMeta({ employee, tone = "plain" }: { employee: EmployeeLookupDto; tone?: "plain" | "pill" }) {
   const { orgUnit, location } = employee
   const hasFloor = Boolean(location?.floor)
   const hasRoom = Boolean(location?.roomNumber)
   if (!orgUnit && !hasFloor && !hasRoom && tone === "pill") return null

   const itemClass =
      tone === "pill"
         ? "inline-flex max-w-full items-center gap-1 rounded-full border border-brand-200/70 bg-surface/80 px-2 py-1 text-[10px] font-bold text-navy-600 dark:border-brand-500/20 dark:bg-navy-900/50 dark:text-navy-300"
         : "inline-flex items-center gap-1"

   return (
      <span
         className={
            tone === "pill"
               ? "flex flex-wrap gap-1.5"
               : "flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-medium text-navy-500 dark:text-navy-400"
         }
      >
         {orgUnit ? (
            <span className={itemClass}>
               <BuildingOffice2Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
               <span className="min-w-0 truncate">{orgUnit.name}</span>
            </span>
         ) : null}

         {hasFloor ? (
            <span className={itemClass}>
               <MapPinIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
               {fa.employees.form.floor} {location?.floor}
            </span>
         ) : null}

         {hasRoom ? (
            <span className={itemClass}>
               <HomeModernIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
               {fa.employees.form.roomNumber} {location?.roomNumber}
            </span>
         ) : null}

         {tone === "plain" ? (
            <span className={itemClass}>
               <Squares2X2Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
               {fa.employees.assetsCount.replace("{count}", employee.activeAssetCount.toLocaleString("fa-IR"))}
            </span>
         ) : null}
      </span>
   )
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
   label,
   initial = null,
}: EmployeePickerProps) {
   const inputId = useId()
   const [query, setQuery] = useState("")
   const [debounced, setDebounced] = useState("")
   const [employees, setEmployees] = useState<EmployeeLookupDto[]>([])
   const [selectedState, setSelected] = useState<EmployeeLookupDto | null>(initial)
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
         <div className="relative">
            {label ? <span className={floatingLabelClass()}>{label}</span> : null}

            <div className="animate-fade-in-up overflow-hidden rounded-xl border border-brand-300 bg-surface dark:border-brand-500/30">
               <div className="flex items-start justify-between gap-3 p-3 sm:p-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                     <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-600 to-accent-600 text-xs font-extrabold text-white shadow-sm">
                        {initialsOf(selected)}
                     </span>
                     <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-navy-900 dark:text-white">
                           {selected.firstName} {selected.lastName}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] font-medium text-navy-500 dark:text-navy-300">
                           {selected.personnelCode ?? selected.username}
                        </p>
                     </div>
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
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-navy-500 transition-colors hover:bg-surface-muted hover:text-navy-800 dark:text-navy-300 dark:hover:bg-navy-800 dark:hover:text-white"
                     >
                        <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                     </button>
                  ) : null}
               </div>

               {selected.orgUnit || selected.location?.floor || selected.location?.roomNumber ? (
                  <div className="border-t border-brand-200/70 px-3 py-2.5 dark:border-brand-500/20 sm:px-3.5">
                     <EmployeeMeta employee={selected} tone="pill" />
                  </div>
               ) : null}
            </div>
         </div>
      )
   }

   return (
      <div className="relative">
         {label ? (
            <label htmlFor={inputId} className={floatingLabelClass()}>
               {label}
            </label>
         ) : null}
         <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-navy-500 dark:text-navy-400"
         >
            <MagnifyingGlassIcon className="h-5 w-5" />
         </span>
         <input
            id={inputId}
            type="search"
            value={query}
            disabled={disabled}
            aria-label={label ?? placeholder}
            onChange={(event) => {
               setQuery(event.target.value)
               setLoading(true)
               setError(null)
            }}
            placeholder={placeholder}
            className="w-full rounded-xl border border-navy-300 bg-surface py-4 ps-10 pe-4 text-sm font-medium text-navy-800 outline-none transition-colors hover:border-brand-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:opacity-60 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
         />

         {query || loading ? (
            <div className="animate-fade-in-up absolute inset-x-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-border-subtle bg-surface p-1.5 shadow-2xl shadow-navy-950/20 dark:border-navy-700 dark:bg-navy-900">
               {loading ? (
                  <p className="px-3 py-2.5 text-xs text-navy-500 dark:text-navy-400">{fa.common.loading}</p>
               ) : error ? (
                  <p className="px-3 py-2.5 text-xs font-bold text-red-600 dark:text-red-300">{error}</p>
               ) : employees.length === 0 ? (
                  <p className="px-3 py-2.5 text-xs text-navy-500 dark:text-navy-400">{fa.assets.assign.noEmployees}</p>
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
                        className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-start transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:hover:bg-navy-800"
                     >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-extrabold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                           {initialsOf(employee)}
                        </span>
                        <span className="min-w-0 flex-1">
                           <span className="block truncate text-sm font-bold text-navy-900 dark:text-white">
                              {employee.firstName} {employee.lastName}
                           </span>
                           <span className="mt-0.5 block truncate text-[11px] text-navy-500 dark:text-navy-400">
                              {employee.personnelCode ?? employee.username}
                           </span>
                           <span className="mt-1 block">
                              <EmployeeMeta employee={employee} />
                           </span>
                        </span>
                     </button>
                  ))
               )}
            </div>
         ) : null}
      </div>
   )
}
