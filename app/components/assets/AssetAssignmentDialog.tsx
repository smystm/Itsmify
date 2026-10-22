"use client"

import { useState } from "react"
import Modal from "@/app/components/ui/Modal"
import AdminNotice from "@/app/components/ui/AdminNotice"
import EmployeePicker from "./EmployeePicker"
import { ApiError, postJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import type { EmployeeLookupDto } from "@/lib/employees/types"

interface AssetAssignmentDialogProps {
   assetId: string
   assetName: string
   currentAssignee?: string | null
   onClose: () => void
   onDone: () => void
}

export default function AssetAssignmentDialog({
   assetId,
   assetName,
   currentAssignee,
   onClose,
   onDone,
}: AssetAssignmentDialogProps) {
   const [employee, setEmployee] = useState<EmployeeLookupDto | null>(null)
   const [note, setNote] = useState("")
   const [busy, setBusy] = useState(false)
   const [error, setError] = useState<string | null>(null)

   const submit = async () => {
      if (!employee) {
         setError(fa.assets.assign.invalidEmployee)
         return
      }
      setBusy(true)
      setError(null)
      try {
         await postJson(`/api/admin/assets/${assetId}/assign`, {
            employeeId: employee.profileId,
            note,
         })
         onDone()
      } catch (err) {
         setError(actionError(err))
      } finally {
         setBusy(false)
      }
   }

   return (
      <Modal
         title={fa.assets.assign.title}
         description={fa.assets.assign.description.replace("{name}", assetName)}
         onClose={onClose}
      >
         <div className="space-y-4">
            {currentAssignee ? (
               <div className="rounded-2xl bg-surface-muted/70 px-4 py-3 text-xs dark:bg-navy-900/50">
                  <p className="font-bold text-navy-700 dark:text-navy-200">{fa.assets.detail.currentAssignee}</p>
                  <p className="mt-1 text-navy-600 dark:text-navy-300">{currentAssignee}</p>
               </div>
            ) : null}

            <EmployeePicker value={employee?.profileId ?? ""} onChange={setEmployee} />

            <label className="block">
               <span className="mb-1.5 block text-sm font-bold text-navy-800 dark:text-navy-200">{fa.assets.assign.note}</span>
               <textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={fa.assets.assign.notePlaceholder}
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
                  className="rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all hover:brightness-110 disabled:opacity-60"
               >
                  {busy ? fa.assets.assign.saving : fa.assets.assign.confirm}
               </button>
            </div>
         </div>
      </Modal>
   )
}

function actionError(err: unknown): string {
   if (err instanceof ApiError) {
      if (err.code === "already_assigned") return fa.assets.assign.alreadyAssigned
      if (err.code === "asset_unavailable") return fa.assets.assign.cannotAssignUnavailable
      if (err.errors && Object.keys(err.errors).length > 0) {
         return Object.values(err.errors)[0] ?? fa.admin.genericError
      }
   }
   return fa.admin.genericError
}
