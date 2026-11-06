"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ValidationError } from "yup"
import AdminNotice from "@/app/components/ui/AdminNotice"
import { TicketVisibilityBadge } from "./TicketBadges"
import { postJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import { formatJalaliDateTime } from "@/lib/date/jalali"
import { adminCommentSchema, commentSchema, type TicketVisibilityValue } from "@/lib/tickets/validation"
import type { TicketCommentDto } from "@/lib/tickets/types"
import { ticketErrorMessage } from "./ticket-error"

interface TicketCommentsProps {
   ticketId: string
   comments: TicketCommentDto[]
   mode: "employee" | "admin"
   canComment: boolean
}

export default function TicketComments({ ticketId, comments, mode, canComment }: TicketCommentsProps) {
   const router = useRouter()
   const admin = mode === "admin"
   const [body, setBody] = useState("")
   const [visibility, setVisibility] = useState<TicketVisibilityValue>("PUBLIC")
   const [fieldError, setFieldError] = useState<string | null>(null)
   const [formError, setFormError] = useState<string | null>(null)
   const [notice, setNotice] = useState<string | null>(null)
   const [busy, setBusy] = useState(false)

   const submit = async () => {
      setFieldError(null)
      setFormError(null)
      setNotice(null)

      const payload = admin ? { body: body.trim(), visibility } : { body: body.trim() }
      try {
         await (admin ? adminCommentSchema : commentSchema).validate(payload, { abortEarly: false })
      } catch (err) {
         if (err instanceof ValidationError) setFieldError(err.errors[0] ?? fa.tickets.validation.requiredBody)
         else setFieldError(fa.tickets.validation.requiredBody)
         return
      }

      setBusy(true)
      try {
         const endpoint = admin
            ? `/api/admin/tickets/${ticketId}/comments`
            : `/api/panel/tickets/${ticketId}/comments`
         await postJson(endpoint, payload)
         setBody("")
         setVisibility("PUBLIC")
         setNotice(fa.tickets.comments.success)
         router.refresh()
      } catch (err) {
         setFormError(ticketErrorMessage(err, fa.tickets.comments.failed))
      } finally {
         setBusy(false)
      }
   }

   return (
      <div className="space-y-5">
         {comments.length === 0 ? (
            <p className="rounded-2xl bg-surface-muted/60 px-4 py-3 text-xs text-navy-500 dark:bg-navy-900/50 dark:text-navy-400">
               {fa.tickets.comments.empty}
            </p>
         ) : (
            <ol className="space-y-3">
               {comments.map((comment) => {
                  const internal = comment.visibility === "INTERNAL"
                  const name = `${comment.author.firstName} ${comment.author.lastName}`.trim() || comment.author.username
                  return (
                     <li
                        key={comment.id}
                        className={`rounded-2xl border px-4 py-3 ${
                           internal
                              ? "border-amber-400/50 bg-amber-500/10 dark:border-amber-400/30"
                              : "border-border-subtle bg-surface-muted/40 dark:border-navy-700 dark:bg-navy-900/40"
                        }`}
                     >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                           <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-extrabold text-navy-900 dark:text-white">{name}</span>
                              <span className="text-[10px] font-bold text-navy-500 dark:text-navy-400">
                                 {fa.roles[comment.author.role] ?? comment.author.role}
                              </span>
                              {admin ? <TicketVisibilityBadge visibility={comment.visibility} /> : null}
                           </div>
                           <span className="text-[10px] text-navy-500 dark:text-navy-400">
                              {formatJalaliDateTime(comment.createdAt)}
                           </span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-navy-700 dark:text-navy-200">
                           {comment.body}
                        </p>
                     </li>
                  )
               })}
            </ol>
         )}

         {canComment ? (
            <div className="rounded-2xl border border-border-subtle bg-surface p-4 dark:border-navy-700 dark:bg-navy-900/40">
               <label htmlFor="ticket-comment" className="mb-1.5 block text-sm font-bold text-navy-800 dark:text-navy-200">
                  {fa.tickets.comments.submit}
               </label>
               <textarea
                  id="ticket-comment"
                  rows={4}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder={fa.tickets.comments.placeholder}
                  className="w-full resize-y rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm leading-6 text-navy-900 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
               />

               {admin ? (
                  <fieldset className="mt-3">
                     <legend className="mb-2 text-[11px] font-bold text-navy-500 dark:text-navy-400">
                        {fa.tickets.comments.visibility}
                     </legend>
                     <div className="flex flex-wrap gap-2">
                        <label
                           className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                              visibility === "PUBLIC"
                                 ? "border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-200"
                                 : "border-border-subtle text-navy-600 hover:border-brand-400 dark:border-navy-700 dark:text-navy-300"
                           }`}
                        >
                           <input
                              type="radio"
                              name="ticket-comment-visibility"
                              value="PUBLIC"
                              checked={visibility === "PUBLIC"}
                              onChange={() => setVisibility("PUBLIC")}
                              className="h-3.5 w-3.5"
                           />
                           {fa.tickets.comments.public}
                        </label>
                        <label
                           className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                              visibility === "INTERNAL"
                                 ? "border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                                 : "border-border-subtle text-navy-600 hover:border-amber-400 dark:border-navy-700 dark:text-navy-300"
                           }`}
                        >
                           <input
                              type="radio"
                              name="ticket-comment-visibility"
                              value="INTERNAL"
                              checked={visibility === "INTERNAL"}
                              onChange={() => setVisibility("INTERNAL")}
                              className="h-3.5 w-3.5"
                           />
                           {fa.tickets.comments.internal}
                        </label>
                     </div>
                     {visibility === "INTERNAL" ? (
                        <p className="mt-2 text-[11px] leading-5 text-amber-800 dark:text-amber-200">
                           {fa.tickets.comments.internalHint}
                        </p>
                     ) : null}
                  </fieldset>
               ) : null}

               {fieldError ? <p className="mt-2 text-[11px] font-medium text-red-600 dark:text-red-400">{fieldError}</p> : null}
               {formError ? (
                  <div className="mt-3">
                     <AdminNotice tone="error">{formError}</AdminNotice>
                  </div>
               ) : null}
               {notice ? (
                  <div className="mt-3">
                     <AdminNotice tone="success">{notice}</AdminNotice>
                  </div>
               ) : null}

               <div className="mt-3 flex justify-end">
                  <button
                     type="button"
                     disabled={busy}
                     onClick={() => void submit()}
                     className="rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                     {busy ? fa.tickets.comments.submitting : fa.tickets.comments.submit}
                  </button>
               </div>
            </div>
         ) : (
            <p className="rounded-2xl bg-surface-muted/60 px-4 py-3 text-xs text-navy-500 dark:bg-navy-900/50 dark:text-navy-400">
               {fa.tickets.comments.terminal}
            </p>
         )}
      </div>
   )
}
