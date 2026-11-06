"use client"

import { useState } from "react"
import type { FormikHelpers } from "formik"
import { FormShell } from "@/app/components/auth/FormShell"
import Modal from "@/app/components/ui/Modal"
import SelectField from "@/app/components/ui/SelectField"
import AdminNotice from "@/app/components/ui/AdminNotice"
import { ApiError, postJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import { assignTicketSchema } from "@/lib/tickets/validation"
import type { TicketAssigneeOptionDto, TicketDetailDto } from "@/lib/tickets/types"
import { ticketErrorMessage } from "./ticket-error"

interface AssignTicketValues {
   assigneeId: string
}

interface AssignTicketDialogProps {
   ticket: TicketDetailDto
   assignees: TicketAssigneeOptionDto[]
   onClose: () => void
   onDone: (message: string) => void
}

export default function AssignTicketDialog({ ticket, assignees, onClose, onDone }: AssignTicketDialogProps) {
   const [formError, setFormError] = useState<string | null>(null)

   const options = assignees.map((actor) => {
      const name = `${actor.firstName} ${actor.lastName}`.trim() || actor.username
      return { value: actor.id, label: `${name} (${fa.roles[actor.role] ?? actor.role})` }
   })

   const handleSubmit = async (values: AssignTicketValues, helpers: FormikHelpers<AssignTicketValues>) => {
      setFormError(null)
      try {
         await postJson(`/api/admin/tickets/${ticket.id}/assign`, { assigneeId: values.assigneeId })
         onDone(fa.tickets.actions.assignSuccess)
         onClose()
      } catch (err) {
         if (err instanceof ApiError && err.errors?.assigneeId) {
            helpers.setFieldError("assigneeId", err.errors.assigneeId)
         } else {
            console.error("ticket assign failed", err)
            setFormError(ticketErrorMessage(err, fa.tickets.errors.generic))
         }
      } finally {
         helpers.setSubmitting(false)
      }
   }

   return (
      <Modal title={fa.tickets.actions.assignTitle} description={fa.tickets.actions.assignDescription} onClose={onClose}>
         <FormShell<AssignTicketValues>
            initialValues={{ assigneeId: ticket.assignee?.id ?? "" }}
            validationSchema={assignTicketSchema}
            onSubmit={handleSubmit}
            className="space-y-4"
         >
            {({ touched, errors, isSubmitting }) => (
               <>
                  {ticket.assignee ? (
                     <div className="rounded-2xl bg-surface-muted/70 px-4 py-3 text-xs dark:bg-navy-900/50">
                        <p className="font-bold text-navy-700 dark:text-navy-200">{fa.tickets.detail.info.assignee}</p>
                        <p className="mt-1 text-navy-600 dark:text-navy-300">
                           {`${ticket.assignee.firstName} ${ticket.assignee.lastName}`.trim() || ticket.assignee.username}
                        </p>
                     </div>
                  ) : null}

                  {options.length === 0 ? (
                     <AdminNotice tone="info">{fa.tickets.actions.noAssignees}</AdminNotice>
                  ) : (
                     <SelectField
                        name="assigneeId"
                        label={fa.tickets.actions.assignee}
                        placeholder={fa.tickets.actions.assignee}
                        options={options}
                        touched={touched.assigneeId}
                        error={errors.assigneeId}
                     />
                  )}

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
                        type="submit"
                        disabled={isSubmitting || options.length === 0}
                        className="rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                     >
                        {isSubmitting ? fa.tickets.actions.assigning : fa.tickets.actions.assign}
                     </button>
                  </div>
               </>
            )}
         </FormShell>
      </Modal>
   )
}
