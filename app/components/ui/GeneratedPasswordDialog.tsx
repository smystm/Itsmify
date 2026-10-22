"use client"

import { useState } from "react"
import { CheckIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline"
import Modal from "./Modal"
import Button from "./Button"
import { fa } from "@/lib/i18n/fa"

interface GeneratedPasswordDialogProps {
   username: string
   password: string
   onClose: () => void
}

/**
 * One-time credential handoff. The plaintext exists only in this component's
 * props and the creation/reset response; it is never persisted client-side.
 */
export default function GeneratedPasswordDialog({ username, password, onClose }: GeneratedPasswordDialogProps) {
   const [copied, setCopied] = useState(false)

   const copy = async () => {
      try {
         await navigator.clipboard.writeText(password)
         setCopied(true)
         window.setTimeout(() => setCopied(false), 2000)
      } catch (err) {
         console.error("clipboard copy failed", err)
      }
   }

   return (
      <Modal
         title={fa.employees.form.passwordTitle}
         description={fa.employees.form.passwordBody}
         onClose={onClose}
      >
         <p className="text-xs font-bold text-navy-500 dark:text-navy-400">
            {fa.employees.form.passwordFor.replace("{username}", username)}
         </p>

         <div className="mt-3 flex items-center gap-2">
            <code
               dir="ltr"
               className="min-w-0 flex-1 select-all break-all rounded-xl bg-navy-950 px-4 py-3 font-mono text-sm text-white"
            >
               {password}
            </code>
            <button
               type="button"
               onClick={() => void copy()}
               aria-label={fa.employees.form.copyPassword}
               className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-surface text-brand-700 transition-colors hover:border-brand-400 dark:border-navy-700 dark:bg-navy-900 dark:text-brand-200"
            >
               {copied ? (
                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
               ) : (
                  <ClipboardDocumentIcon className="h-5 w-5" aria-hidden="true" />
               )}
            </button>
         </div>

         {copied ? (
            <p className="mt-2 text-xs font-bold text-brand-700 dark:text-brand-200">{fa.employees.form.passwordCopied}</p>
         ) : null}

         <div className="mt-6 flex justify-end">
            <Button type="button" onClick={onClose} fullWidth={false}>
               {fa.employees.form.done}
            </Button>
         </div>
      </Modal>
   )
}
