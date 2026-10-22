"use client"

import { useEffect, useState } from "react"
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

/**
 * Parent/component link. A native select is deliberate here: the option set is
 * small, and a type-ahead would add another async failure mode to a field most
 * assets never use.
 */
export default function ParentAssetSelect({ value, onChange, excludeId, initial, disabled = false }: ParentAssetSelectProps) {
   const [assets, setAssets] = useState<AssetOptionDto[]>([])
   const [loading, setLoading] = useState(true)

   useEffect(() => {
      const controller = new AbortController()
      const params = new URLSearchParams()
      if (excludeId) params.set("excludeId", excludeId)
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
            if (!controller.signal.aborted) console.error("parent asset options failed", err)
         })
         .finally(() => {
            if (!controller.signal.aborted) setLoading(false)
         })
      return () => controller.abort()
   }, [excludeId, initial])

   return (
      <label className="block">
         <span className="mb-1.5 block text-sm font-bold text-navy-800 dark:text-navy-200">{fa.assets.form.parentAsset}</span>
         <select
            value={value}
            disabled={disabled || loading}
            onChange={(event) => {
               const selected = assets.find((asset) => asset.id === event.target.value) ?? null
               onChange(selected)
            }}
            className="w-full rounded-xl border border-navy-300 bg-surface px-4 py-3 text-sm font-bold text-navy-900 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:opacity-60 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
         >
            <option value="">{fa.assets.form.parentPlaceholder}</option>
            {assets.map((asset) => (
               <option key={asset.id} value={asset.id}>
                  {asset.assetCode} — {asset.name}
               </option>
            ))}
         </select>
      </label>
   )
}
