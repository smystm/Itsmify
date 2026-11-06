"use client"

import { useState } from "react"
import type { FormikErrors, FormikHelpers } from "formik"
import type { ObjectSchema } from "yup"
import { FormShell } from "@/app/components/auth/FormShell"
import Modal from "@/app/components/ui/Modal"
import InputField from "@/app/components/ui/InputField"
import SelectField from "@/app/components/ui/SelectField"
import TextareaField from "@/app/components/ui/TextareaField"
import AdminNotice from "@/app/components/ui/AdminNotice"
import { ApiError, patchJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import {
   TICKET_PRIORITIES,
   TICKET_TYPES,
   adminUpdateTicketSchema,
   employeeUpdateTicketSchema,
} from "@/lib/tickets/validation"
import type { TicketCategoryRefDto, TicketDetailDto } from "@/lib/tickets/types"
import { ticketErrorMessage } from "./ticket-error"

interface TicketEditValues {
   type: string
   subject: string
   description: string
   priority: string
   categoryId: string
}

interface TicketEditDialogProps {
   ticket: TicketDetailDto
   mode: "employee" | "admin"
   canEditContent: boolean
   canEditPriorityCategory?: boolean
   categories?: TicketCategoryRefDto[]
   onClose: () => void
   onDone: (message: string) => void
}

export default function TicketEditDialog({
   ticket,
   mode,
   canEditContent,
   canEditPriorityCategory = false,
   categories = [],
   onClose,
   onDone,
}: TicketEditDialogProps) {
   const [formError, setFormError] = useState<string | null>(null)
   const admin = mode === "admin"

   const initialValues: TicketEditValues = {
      type: ticket.type,
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority,
      categoryId: ticket.category.id,
   }

   const typeOptions = TICKET_TYPES.map((type) => ({ value: type, label: fa.tickets.types[type] ?? type }))
   const priorityOptions = TICKET_PRIORITIES.map((priority) => ({
      value: priority,
      label: fa.tickets.priorities[priority] ?? priority,
   }))
   const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }))

   const handleSubmit = async (values: TicketEditValues, helpers: FormikHelpers<TicketEditValues>) => {
      setFormError(null)
      const payload: Record<string, string> = {}

      if (canEditContent) {
         payload.type = values.type
         payload.subject = values.subject.trim()
         payload.description = values.description.trim()
      }
      if (admin && canEditPriorityCategory) {
         payload.priority = values.priority
         payload.categoryId = values.categoryId
      }
      if (Object.keys(payload).length === 0) return

      try {
         await patchJson(`/api/${admin ? "admin" : "panel"}/tickets/${ticket.id}`, payload)
         onDone(fa.tickets.detail.updatedNotice)
         onClose()
      } catch (err) {
         if (err instanceof ApiError && err.errors && Object.keys(err.errors).length > 0) {
            helpers.setErrors(err.errors as FormikErrors<TicketEditValues>)
            setFormError(fa.tickets.create.formError)
         } else {
            console.error("ticket update failed", err)
            setFormError(ticketErrorMessage(err, fa.tickets.errors.generic))
         }
      } finally {
         helpers.setSubmitting(false)
      }
   }

   return (
      <Modal
         title={fa.tickets.detail.editTitle}
         description={admin ? fa.tickets.detail.editDescription : fa.tickets.detail.employeeEditDescription}
         onClose={onClose}
         wide
      >
         <FormShell<TicketEditValues>
            initialValues={initialValues}
            validationSchema={
               (admin ? adminUpdateTicketSchema : employeeUpdateTicketSchema) as unknown as ObjectSchema<Record<string, unknown>>
            }
            onSubmit={handleSubmit}
            className="space-y-5"
            validateOnChange={false}
            validateOnBlur={false}
         >
            {({ touched, errors, isSubmitting }) => (
               <>
                  {canEditContent ? (
                     <div className="space-y-5">
                        <SelectField
                           name="type"
                           label={fa.tickets.create.type}
                           placeholder={fa.tickets.create.typePlaceholder}
                           options={typeOptions}
                           touched={touched.type}
                           error={errors.type}
                        />
                        <InputField
                           name="subject"
                           label={fa.tickets.create.subject}
                           placeholder={fa.tickets.create.subjectPlaceholder}
                           touched={touched.subject}
                           error={errors.subject}
                        />
                        <TextareaField
                           name="description"
                           label={fa.tickets.create.description}
                           placeholder={fa.tickets.create.descriptionPlaceholder}
                           rows={6}
                           touched={touched.description}
                           error={errors.description}
                        />
                     </div>
                  ) : null}

                  {admin && canEditPriorityCategory ? (
                     <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <SelectField
                           name="priority"
                           label={fa.tickets.create.priority}
                           placeholder={fa.tickets.create.priorityPlaceholder}
                           options={priorityOptions}
                           touched={touched.priority}
                           error={errors.priority}
                        />
                        <SelectField
                           name="categoryId"
                           label={fa.tickets.create.category}
                           placeholder={fa.tickets.create.categoryPlaceholder}
                           options={categoryOptions}
                           touched={touched.categoryId}
                           error={errors.categoryId}
                        />
                     </div>
                  ) : null}

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
                        disabled={isSubmitting}
                        className="rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                     >
                        {isSubmitting ? fa.common.saving : fa.common.save}
                     </button>
                  </div>
               </>
            )}
         </FormShell>
      </Modal>
   )
}
