"use client"

import Modal from "./Modal"
import { fa } from "@/lib/i18n/fa"

interface ConfirmDialogProps {
   title: string
   body: string
   confirmLabel: string
   busy?: boolean
   destructive?: boolean
   onConfirm: () => void | Promise<void>
   onClose: () => void
}

export default function ConfirmDialog({
   title,
   body,
   confirmLabel,
   busy = false,
   destructive = false,
   onConfirm,
   onClose,
}: ConfirmDialogProps) {
   return (
      <Modal title={title} onClose={onClose}>
         <p className="text-sm leading-7 text-navy-700 dark:text-navy-200">{body}</p>

         <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
               type="button"
               onClick={onClose}
               className="rounded-full px-5 py-2.5 text-sm font-bold text-navy-600 transition-colors hover:bg-surface-muted dark:text-navy-300 dark:hover:bg-navy-800"
            >
               {fa.admin.cancel}
            </button>
            <button
               type="button"
               disabled={busy}
               onClick={() => void onConfirm()}
               className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${
                  destructive
                     ? "bg-linear-to-l from-red-600 to-red-700 shadow-red-700/25"
                     : "bg-linear-to-l from-brand-700 to-brand-800 shadow-brand-700/25"
               }`}
            >
               {busy ? fa.admin.saving : confirmLabel}
            </button>
         </div>
      </Modal>
   )
}
