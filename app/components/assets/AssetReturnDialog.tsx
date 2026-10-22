"use client"

import { useState } from "react"
import Modal from "@/app/components/ui/Modal"
import AdminNotice from "@/app/components/ui/AdminNotice"
import { ApiError, postJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"

interface AssetReturnDialogProps {
   assetId: string
   assetName: string
   onClose: () => void
   onDone: () => void
}

export default function AssetReturnDialog({ assetId, assetName, onClose, onDone }: AssetReturnDialogProps) {
   const [note, setNote] = useState("")
   const [busy, setBusy] = useState(false)
   const [error, setError] = useState<string | null>(null)

   const submit = async () => {
      setBusy(true)
      setError(null)
      try {
         await postJson(`/api/admin/assets/${assetId}/return`, { note })
         onDone()
      } catch (err) {
         if (err instanceof ApiError && err.code === "not_assigned") {
            setError(fa.assets.assign.notAssigned)
         } else {
            setError(fa.admin.genericError)
         }
      } finally {
         setBusy(false)
      }
   }

   return (
      <Modal
         title={fa.assets.assign.returnTitle}
         description={fa.assets.assign.returnDescription.replace("{name}", assetName)}
         onClose={onClose}
      >
         <div className="space-y-4">
            <label className="block">
               <span className="mb-1.5 block text-sm font-bold text-navy-800 dark:text-navy-200">
                  {fa.assets.assign.returnNote}
               </span>
               <textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="w-full resize-y rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm leading-6 text-navy-900 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
               />
            </label>

            {error ? <AdminNotice tone="error">{error}</AdminNotice> : null}

            <div className="flex justify-end gap-3">
               <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-4 py-2 text-sm font-bold text-navy-600 hover:bg-surface-muted dark:text-navy-300 dark:hover:bg-navy-800"
               >
                  {fa.common.cancel}
               </button>
               <button
                  type="button"
                  disabled={busy}
                  onClick={() => void submit()}
                  className="rounded-full bg-linear-to-l from-accent-600 to-accent-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent-700/25 transition-all hover:brightness-110 disabled:opacity-60"
               >
                  {busy ? fa.assets.assign.saving : fa.assets.assign.returnConfirm}
               </button>
            </div>
         </div>
      </Modal>
   )
}
