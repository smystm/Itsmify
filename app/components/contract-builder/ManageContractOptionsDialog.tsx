"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import {
   CheckIcon,
   PencilSquareIcon,
   PlusIcon,
   TrashIcon,
   XMarkIcon,
} from "@heroicons/react/24/outline"
import Modal from "@/app/components/ui/Modal"
import AdminNotice from "@/app/components/ui/AdminNotice"
import ConfirmDialog from "@/app/components/ui/ConfirmDialog"
import { ApiError, deleteJson, patchJson, postJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import type { ContractOptionKind } from "@/lib/contracts/kinds"
import type { ContractOptionDto } from "@/lib/contracts/types"

interface ManageContractOptionsDialogProps {
   kind: ContractOptionKind
   options: ContractOptionDto[]
   onReload: () => Promise<void>
   onClose: () => void
}

const inputClass =
   "w-full rounded-xl border border-navy-300 bg-surface px-4 py-2.5 text-sm text-navy-900 outline-none transition-all duration-200 placeholder:text-navy-500 hover:border-brand-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50 dark:placeholder:text-navy-400"

export default function ManageContractOptionsDialog({
   kind,
   options,
   onReload,
   onClose,
}: ManageContractOptionsDialogProps) {
   const meta = fa.contractBuilder.kinds[kind]
   const [name, setName] = useState("")
   const [busy, setBusy] = useState(false)
   const [error, setError] = useState<string | null>(null)
   const [notice, setNotice] = useState<string | null>(null)
   const [editingId, setEditingId] = useState<string | null>(null)
   const [editName, setEditName] = useState("")
   const [deleting, setDeleting] = useState<ContractOptionDto | null>(null)

   const actionError = (err: unknown) => {
      if (err instanceof ApiError) {
         if (err.code === "contract_in_use") {
            const count = typeof err.details?.count === "number" ? err.details.count : 0
            return fa.contractBuilder.inUse.replace("{count}", count.toLocaleString("fa-IR"))
         }
         if (err.errors?.name) return err.errors.name
         if (err.code === "not_found") return fa.contractBuilder.notFound
      }
      return fa.admin.genericError
   }

   const add = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const value = name.trim()
      if (!value) return

      setBusy(true)
      setError(null)
      setNotice(null)
      try {
         await postJson("/api/admin/contract-options", { kind, name: value })
         setName("")
         setNotice(fa.contractBuilder.added)
         await onReload()
      } catch (err) {
         setError(actionError(err))
      } finally {
         setBusy(false)
      }
   }

   const startEdit = (option: ContractOptionDto) => {
      setEditingId(option.id)
      setEditName(option.name)
      setError(null)
      setNotice(null)
   }

   const saveEdit = async (id: string) => {
      const value = editName.trim()
      if (!value) return

      setBusy(true)
      setError(null)
      setNotice(null)
      try {
         await patchJson(`/api/admin/contract-options/${id}`, { name: value })
         setEditingId(null)
         setNotice(fa.contractBuilder.updated)
         await onReload()
      } catch (err) {
         setError(actionError(err))
      } finally {
         setBusy(false)
      }
   }

   const remove = async () => {
      if (!deleting) return

      setBusy(true)
      setError(null)
      setNotice(null)
      try {
         await deleteJson(`/api/admin/contract-options/${deleting.id}`)
         setDeleting(null)
         setNotice(fa.contractBuilder.deleted)
         await onReload()
      } catch (err) {
         setDeleting(null)
         setError(actionError(err))
      } finally {
         setBusy(false)
      }
   }

   return (
      <Modal
         title={meta.label}
         description={fa.contractBuilder.manageDescription.replace("{name}", meta.label)}
         onClose={onClose}
         wide
      >
         <form onSubmit={(event) => void add(event)} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1">
               <span className="mb-1.5 block text-sm font-bold text-navy-800 dark:text-navy-200">
                  {fa.contractBuilder.nameLabel}
               </span>
               <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={fa.contractBuilder.addPlaceholder}
                  maxLength={100}
                  className={inputClass}
               />
            </label>
            <button
               type="submit"
               disabled={busy || !name.trim()}
               className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
               <PlusIcon className="h-4 w-4" aria-hidden="true" />
               {busy ? fa.contractBuilder.adding : fa.contractBuilder.addAction}
            </button>
         </form>

         {error ? <AdminNotice tone="error" className="mt-4">{error}</AdminNotice> : null}
         {notice ? <AdminNotice tone="success" className="mt-4">{notice}</AdminNotice> : null}

         <div className="mt-5">
            {options.length === 0 ? (
               <div className="rounded-2xl border border-dashed border-navy-300 px-5 py-8 text-center dark:border-navy-700">
                  <p className="text-sm font-extrabold text-navy-950 dark:text-white">{fa.contractBuilder.emptyTitle}</p>
                  <p className="mt-1.5 text-xs leading-6 text-navy-500 dark:text-navy-400">{fa.contractBuilder.emptyBody}</p>
               </div>
            ) : (
               <ul role="list" className="space-y-2">
                  {options.map((option) => (
                     <li
                        key={option.id}
                        className="flex flex-wrap items-center gap-2 rounded-2xl border border-border-subtle bg-surface-muted/40 px-3 py-2 dark:border-navy-700 dark:bg-navy-900/40"
                     >
                        {editingId === option.id ? (
                           <>
                              <input
                                 value={editName}
                                 onChange={(event) => setEditName(event.target.value)}
                                 onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                       event.preventDefault()
                                       void saveEdit(option.id)
                                    }
                                    if (event.key === "Escape") {
                                       event.stopPropagation()
                                       setEditingId(null)
                                    }
                                 }}
                                 maxLength={100}
                                 className={`${inputClass} min-w-0 flex-1 py-2`}
                              />
                              <RowAction
                                 label={fa.contractBuilder.saveAction}
                                 onClick={() => void saveEdit(option.id)}
                                 disabled={busy || !editName.trim()}
                                 tone="success"
                              >
                                 <CheckIcon className="h-4 w-4" aria-hidden="true" />
                              </RowAction>
                              <RowAction label={fa.common.cancel} onClick={() => setEditingId(null)}>
                                 <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                              </RowAction>
                           </>
                        ) : (
                           <>
                              <span className="min-w-0 flex-1 truncate px-1 text-sm font-bold text-navy-900 dark:text-navy-50">
                                 {option.name}
                              </span>
                              <RowAction label={fa.contractBuilder.editAction} onClick={() => startEdit(option)}>
                                 <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                              </RowAction>
                              <RowAction
                                 label={fa.contractBuilder.deleteAction}
                                 onClick={() => {
                                    setError(null)
                                    setNotice(null)
                                    setDeleting(option)
                                 }}
                                 tone="danger"
                              >
                                 <TrashIcon className="h-4 w-4" aria-hidden="true" />
                              </RowAction>
                           </>
                        )}
                     </li>
                  ))}
               </ul>
            )}
         </div>

         <div className="mt-6 flex justify-end">
            <button
               type="button"
               onClick={onClose}
               className="rounded-full px-5 py-2.5 text-sm font-bold text-navy-600 transition-colors hover:bg-surface-muted dark:text-navy-300 dark:hover:bg-navy-800"
            >
               {fa.contractBuilder.close}
            </button>
         </div>

         {deleting ? (
            <ConfirmDialog
               title={fa.contractBuilder.deleteAction}
               body={fa.contractBuilder.deleteConfirm.replace("{name}", deleting.name)}
               confirmLabel={fa.contractBuilder.deleteConfirmAction}
               busy={busy}
               destructive
               onClose={() => setDeleting(null)}
               onConfirm={remove}
            />
         ) : null}
      </Modal>
   )
}

function RowAction({
   label,
   onClick,
   disabled = false,
   tone = "neutral",
   children,
}: {
   label: string
   onClick: () => void
   disabled?: boolean
   tone?: "neutral" | "success" | "danger"
   children: ReactNode
}) {
   const tones = {
      neutral: "text-navy-600 hover:border-brand-400 hover:text-brand-700 dark:text-navy-300 dark:hover:text-brand-200",
      success: "text-emerald-600 hover:border-emerald-400 dark:text-emerald-300",
      danger: "text-red-600 hover:border-red-400 dark:text-red-300",
   }

   return (
      <button
         type="button"
         onClick={onClick}
         disabled={disabled}
         aria-label={label}
         title={label}
         className={`rounded-full border border-border-subtle p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 dark:border-navy-700 ${tones[tone]}`}
      >
         {children}
      </button>
   )
}
