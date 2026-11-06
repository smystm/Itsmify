"use client"

import { useState } from "react"
import { ValidationError } from "yup"
import Modal from "@/app/components/ui/Modal"
import AdminNotice from "@/app/components/ui/AdminNotice"
import { TicketStatusBadge, ticketStatusLabel } from "./TicketBadges"
import { postJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import { adminStatusSchema, employeeStatusSchema, type TicketStatusValue } from "@/lib/tickets/validation"
import { ticketErrorMessage } from "./ticket-error"

interface TicketStatusDialogProps {
   ticketId: string
   target: TicketStatusValue
   mode: "employee" | "admin"
   onClose: () => void
   onDone: (message: string) => void
}

function targetActionLabel(target: TicketStatusValue): string {
   switch (target) {
      case "CANCELLED":
         return fa.tickets.actions.cancel
      case "CLOSED":
         return fa.tickets.actions.close
      case "IN_PROGRESS":
         return fa.tickets.actions.reopen
      case "RESOLVED":
         return fa.tickets.actions.resolve
      default:
         return ticketStatusLabel(target)
   }
}

export default function TicketStatusDialog({ ticketId, target, mode, onClose, onDone }: TicketStatusDialogProps) {
   const [note, setNote] = useState("")
   const [resolutionNote, setResolutionNote] = useState("")
   const [fieldError, setFieldError] = useState<string | null>(null)
   const [formError, setFormError] = useState<string | null>(null)
   const [busy, setBusy] = useState(false)

   const needsResolution = mode === "admin" && target === "RESOLVED"

   const submit = async () => {
      setFieldError(null)
      setFormError(null)

      if (needsResolution && resolutionNote.trim().length < 5) {
         setFieldError(fa.tickets.validation.resolutionNoteShort)
         return
      }

      const payload =
         mode === "admin"
            ? { status: target, note: note.trim(), resolutionNote: resolutionNote.trim() }
            : { status: target, note: note.trim() }

      try {
         await (mode === "admin" ? adminStatusSchema : employeeStatusSchema).validate(payload, { abortEarly: false })
      } catch (err) {
         if (err instanceof ValidationError) {
            setFieldError(err.errors[0] ?? fa.tickets.errors.generic)
         } else {
            setFieldError(fa.tickets.errors.generic)
         }
         return
      }

      setBusy(true)
      try {
         const endpoint = mode === "admin" ? `/api/admin/tickets/${ticketId}/status` : `/api/panel/tickets/${ticketId}/status`
         await postJson(endpoint, payload)
         onDone(fa.tickets.actions.success.replace("{status}", ticketStatusLabel(target)))
         onClose()
      } catch (err) {
         setFormError(ticketErrorMessage(err, fa.tickets.errors.generic))
      } finally {
         setBusy(false)
      }
   }

   return (
      <Modal
         title={`${fa.tickets.actions.statusTitle}: ${ticketStatusLabel(target)}`}
         description={fa.tickets.actions.statusDescription}
         onClose={onClose}
      >
         <div className="space-y-4">
            <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-navy-500 dark:text-navy-400">{fa.tickets.detail.info.status}</span>
               <TicketStatusBadge status={target} />
            </div>

            {needsResolution ? (
               <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-navy-800 dark:text-navy-200">
                     {fa.tickets.actions.resolution}
                  </span>
                  <textarea
                     rows={4}
                     value={resolutionNote}
                     onChange={(event) => setResolutionNote(event.target.value)}
                     placeholder={fa.tickets.actions.resolutionPlaceholder}
                     className="w-full resize-y rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm leading-6 text-navy-900 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
                  />
               </label>
            ) : (
               <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-navy-800 dark:text-navy-200">{fa.tickets.actions.note}</span>
                  <textarea
                     rows={3}
                     value={note}
                     onChange={(event) => setNote(event.target.value)}
                     placeholder={fa.tickets.actions.notePlaceholder}
                     className="w-full resize-y rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm leading-6 text-navy-900 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
                  />
               </label>
            )}

            {fieldError ? <p className="text-[11px] font-medium text-red-600 dark:text-red-400">{fieldError}</p> : null}
            {formError ? <AdminNotice tone="error">{formError}</AdminNotice> : null}

            <div className="flex flex-wrap justify-end gap-3">
               <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-5 py-2.5 text-sm font-bold text-navy-600 transition-colors hover:bg-surface-muted dark:text-navy-300 dark:hover:bg-navy-800"
               >
                  {fa.common.cancel}
               </button>
               <button
                  type="button"
                  disabled={busy}
                  onClick={() => void submit()}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${
                     target === "CANCELLED"
                        ? "bg-linear-to-l from-red-600 to-red-700 shadow-red-700/25"
                        : "bg-linear-to-l from-brand-700 to-brand-800 shadow-brand-700/25"
                  }`}
               >
                  {busy ? fa.tickets.actions.saving : `${targetActionLabel(target)}`}
               </button>
            </div>
         </div>
      </Modal>
   )
}
