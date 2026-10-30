"use client"

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react"
import { getJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import type { AssetOptionDto } from "@/lib/assets/types"

interface ParentAssetSelectProps {
   value: string
   onChange: (asset: AssetOptionDto | null) => void
   excludeId?: string
   initial?: { id: string; assetCode: string; name: string; type: string } | null
   disabled?: boolean
}

export default function ParentAssetSelect({ value, onChange, excludeId, initial, disabled = false }: ParentAssetSelectProps) {
   const [assets, setAssets] = useState<AssetOptionDto[]>([])
   const [loading, setLoading] = useState(true)
   const [isOpen, setIsOpen] = useState(false)
   const [activeIndex, setActiveIndex] = useState(0)

   const containerRef = useRef<HTMLDivElement>(null)
   const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

   const selectedAsset = assets.find((asset) => asset.id === value)

   useEffect(() => {
      const controller = new AbortController()

      const params = new URLSearchParams()
      if (excludeId) params.set("excludeId", excludeId)

      setLoading(true)

      void getJson<{ assets: AssetOptionDto[] }>(`/api/admin/assets/options?${params.toString()}`, controller.signal)
         .then((result) => {
            const rows = [...result.assets]

            if (initial && !rows.some((row) => row.id === initial.id)) {
               rows.unshift({
                  id: initial.id,
                  assetCode: initial.assetCode,
                  name: initial.name,
                  type: initial.type as AssetOptionDto["type"],
               })
            }

            setAssets(rows)
         })
         .catch((err) => {
            if (!controller.signal.aborted) {
               console.error("parent asset options failed", err)
            }
         })
         .finally(() => {
            if (!controller.signal.aborted) setLoading(false)
         })

      return () => controller.abort()
   }, [excludeId, initial?.id, initial?.assetCode, initial?.name, initial?.type])

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsOpen(false)
         }
      }

      const handleEscape = (event: globalThis.KeyboardEvent) => {
         if (event.key === "Escape") setIsOpen(false)
      }

      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)

      return () => {
         document.removeEventListener("mousedown", handleClickOutside)
         document.removeEventListener("keydown", handleEscape)
      }
   }, [])

   useEffect(() => {
      if (isOpen && assets.length > 0) {
         const selectedIndex = assets.findIndex((asset) => asset.id === value)

         setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
      }
   }, [isOpen, assets, value])

   useEffect(() => {
      if (isOpen) {
         optionRefs.current[activeIndex]?.scrollIntoView({
            block: "nearest",
         })
      }
   }, [activeIndex, isOpen])

   const selectAsset = (asset: AssetOptionDto | null) => {
      onChange(asset)
      setIsOpen(false)
   }

   const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (disabled || loading) return

      if (!isOpen) {
         if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            setIsOpen(true)
         }
         return
      }

      switch (event.key) {
         case "ArrowDown":
            event.preventDefault()
            setActiveIndex((prev) => Math.min(prev + 1, assets.length - 1))
            break

         case "ArrowUp":
            event.preventDefault()
            setActiveIndex((prev) => Math.max(prev - 1, 0))
            break

         case "Home":
            event.preventDefault()
            setActiveIndex(0)
            break

         case "End":
            event.preventDefault()
            setActiveIndex(assets.length - 1)
            break

         case "Enter":
         case " ":
            event.preventDefault()
            if (assets[activeIndex]) {
               selectAsset(assets[activeIndex])
            }
            break

         case "Escape":
            event.preventDefault()
            setIsOpen(false)
            break
      }
   }

   return (
      <label className="block">
         <span className="mb-1.5 block text-sm font-bold text-navy-800 dark:text-navy-200">{fa.assets.form.parentAsset}</span>

         <div ref={containerRef} className="relative">
            {/* Trigger */}
            <button
               type="button"
               disabled={disabled || loading}
               aria-haspopup="listbox"
               aria-expanded={isOpen}
               onClick={() => setIsOpen((prev) => !prev)}
               onKeyDown={handleKeyDown}
               className={`
                  relative flex w-full items-center justify-between
                  rounded-xl border bg-surface py-3 pl-10 pr-4
                  text-sm font-bold text-navy-900 outline-none
                  transition-all duration-200
                  disabled:cursor-not-allowed disabled:opacity-60
                  dark:bg-navy-900 dark:text-navy-50

                  ${isOpen ? "border-brand-500 ring-4 ring-brand-500/15" : "border-navy-300 hover:border-brand-400 dark:border-navy-700"}
               `}
            >
               <span className={`truncate ${!selectedAsset ? "text-navy-400 dark:text-navy-500" : ""}`}>
                  {loading ? "در حال دریافت اطلاعات..." : selectedAsset ? `${selectedAsset.assetCode} — ${selectedAsset.name}` : fa.assets.form.parentPlaceholder}
               </span>

               <svg
                  className={`
                     absolute left-3 h-4 w-4 shrink-0
                     text-navy-400 transition-transform duration-200
                     dark:text-navy-500
                     ${isOpen ? "rotate-180 text-brand-500" : ""}
                  `}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
               >
                  <path d="m6 9 6 6 6-6" />
               </svg>
            </button>

            {/* Dropdown */}
            <div
               className={`
                  absolute left-0 top-full z-50 mt-2 w-full
                  origin-top overflow-hidden rounded-xl
                  border border-navy-200 bg-surface p-1.5
                  shadow-xl shadow-navy-900/10
                  transition-all duration-200 ease-out
                  dark:border-navy-700 dark:bg-navy-900

                  ${isOpen ? "visible translate-y-0 scale-100 opacity-100" : "invisible pointer-events-none -translate-y-2 scale-[0.98] opacity-0"}
               `}
               role="listbox"
            >
               <div className="max-h-60 overflow-y-auto">
                  {/* No parent */}
                  <button
                     type="button"
                     role="option"
                     aria-selected={!value}
                     onClick={() => selectAsset(null)}
                     className={`
                        flex w-full items-center justify-between
                        rounded-lg px-3 py-2.5 text-sm font-medium
                        transition-colors
                        ${!value ? "bg-brand-500/10 text-brand-600 dark:text-brand-400" : "text-navy-500 hover:bg-navy-100 dark:text-navy-400 dark:hover:bg-navy-800"}
                     `}
                  >
                     <span>{fa.assets.form.parentPlaceholder}</span>

                     {!value && (
                        <svg className="h-4 w-4 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                           <path d="m5 12 4 4L19 6" />
                        </svg>
                     )}
                  </button>

                  {/* Assets */}
                  {assets.map((asset, index) => {
                     const isSelected = asset.id === value
                     const isActive = index === activeIndex

                     return (
                        <button
                           key={asset.id}
                           ref={(element) => {
                              optionRefs.current[index] = element
                           }}
                           type="button"
                           role="option"
                           aria-selected={isSelected}
                           onClick={() => selectAsset(asset)}
                           onMouseEnter={() => setActiveIndex(index)}
                           className={`
                              flex w-full items-center justify-between
                              gap-3 rounded-lg px-3 py-2.5
                              text-sm font-semibold
                              transition-colors duration-150

                              ${
                                 isSelected
                                    ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                                    : isActive
                                      ? "bg-navy-100 text-navy-900 dark:bg-navy-800 dark:text-navy-100"
                                      : "text-navy-700 dark:text-navy-200"
                              }
                           `}
                        >
                           <span className="min-w-0 truncate text-left">
                              <span className="font-extrabold">{asset.assetCode}</span>
                              <span className="mx-1.5 text-navy-400">—</span>
                              {asset.name}
                           </span>

                           {isSelected && (
                              <svg
                                 className="h-4 w-4 shrink-0 text-brand-500"
                                 viewBox="0 0 24 24"
                                 fill="none"
                                 stroke="currentColor"
                                 strokeWidth="2.5"
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 aria-hidden="true"
                              >
                                 <path d="m5 12 4 4L19 6" />
                              </svg>
                           )}
                        </button>
                     )
                  })}

                  {/* Empty State */}
                  {!loading && assets.length === 0 && <div className="px-3 py-5 text-center text-xs font-medium text-navy-400 dark:text-navy-500">دارایی‌ای برای انتخاب وجود ندارد.</div>}
               </div>
            </div>
         </div>
      </label>
   )
}
