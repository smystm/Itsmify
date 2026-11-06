"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRightIcon } from "@heroicons/react/24/outline"
import type { FormikErrors, FormikHelpers } from "formik"
import { FormShell } from "@/app/components/auth/FormShell"
import PageHero from "@/app/components/ui/PageHero"
import FormSection from "@/app/components/ui/FormSection"
import InputField from "@/app/components/ui/InputField"
import SelectField from "@/app/components/ui/SelectField"
import TextareaField from "@/app/components/ui/TextareaField"
import AdminNotice from "@/app/components/ui/AdminNotice"
import { ApiError, postJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import { EMPLOYEE_TICKET_PRIORITIES, TICKET_TYPES, createTicketSchema } from "@/lib/tickets/validation"
import type { TicketCategoryRefDto, TicketDetailDto } from "@/lib/tickets/types"
import { ticketErrorMessage } from "./ticket-error"

interface TicketCreateValues {
   type: string
   categoryId: string
   priority: string
   subject: string
   description: string
}

interface TicketCreateFormProps {
   categories: TicketCategoryRefDto[]
}

export default function TicketCreateForm({ categories }: TicketCreateFormProps) {
   const router = useRouter()
   const [formError, setFormError] = useState<string | null>(null)

   const initialValues: TicketCreateValues = {
      type: "",
      categoryId: "",
      priority: "MEDIUM",
      subject: "",
      description: "",
   }

   const typeOptions = TICKET_TYPES.map((type) => ({ value: type, label: fa.tickets.types[type] ?? type }))
   const priorityOptions = EMPLOYEE_TICKET_PRIORITIES.map((priority) => ({
      value: priority,
      label: fa.tickets.priorities[priority] ?? priority,
   }))
   const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }))

   const handleSubmit = async (values: TicketCreateValues, helpers: FormikHelpers<TicketCreateValues>) => {
      setFormError(null)
      try {
         const result = await postJson<{ ticket: TicketDetailDto }>("/api/panel/tickets", {
            type: values.type,
            categoryId: values.categoryId,
            priority: values.priority,
            subject: values.subject.trim(),
            description: values.description.trim(),
         })
         router.push(`/panel/tickets/${result.ticket.id}`)
         router.refresh()
      } catch (err) {
         if (err instanceof ApiError && err.errors && Object.keys(err.errors).length > 0) {
            helpers.setErrors(err.errors as FormikErrors<TicketCreateValues>)
            setFormError(fa.tickets.create.formError)
         } else {
            console.error("ticket create failed", err)
            setFormError(ticketErrorMessage(err, fa.tickets.create.formError))
         }
      } finally {
         helpers.setSubmitting(false)
      }
   }

   return (
      <div className="space-y-6">
         <PageHero
            badge={fa.tickets.create.badge}
            title={fa.tickets.create.title}
            description={fa.tickets.create.heroDescription}
            actions={
               <Link
                  href="/panel/tickets"
                  className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-2.5 text-sm font-bold text-navy-700 transition-colors hover:border-brand-400 hover:text-brand-800 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200"
               >
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  {fa.tickets.detail.backToList}
               </Link>
            }
         />

         {categories.length === 0 ? <AdminNotice tone="info">{fa.tickets.create.emptyCategories}</AdminNotice> : null}
         {formError ? <AdminNotice tone="error">{formError}</AdminNotice> : null}

         <FormShell<TicketCreateValues>
            initialValues={initialValues}
            validationSchema={createTicketSchema}
            onSubmit={handleSubmit}
            className="space-y-5"
         >
            {({ touched, errors, isSubmitting }) => (
               <>
                  <FormSection title={fa.tickets.create.sectionIdentity} hint={fa.tickets.create.sectionIdentityHint}>
                     <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
                        <SelectField
                           name="type"
                           label={fa.tickets.create.type}
                           placeholder={fa.tickets.create.typePlaceholder}
                           options={typeOptions}
                           touched={touched.type}
                           error={errors.type}
                        />
                        <SelectField
                           name="categoryId"
                           label={fa.tickets.create.category}
                           placeholder={fa.tickets.create.categoryPlaceholder}
                           options={categoryOptions}
                           touched={touched.categoryId}
                           error={errors.categoryId}
                        />
                        <SelectField
                           name="priority"
                           label={fa.tickets.create.priority}
                           placeholder={fa.tickets.create.priorityPlaceholder}
                           options={priorityOptions}
                           touched={touched.priority}
                           error={errors.priority}
                        />
                     </div>
                  </FormSection>

                  <FormSection title={fa.tickets.create.sectionDetails} hint={fa.tickets.create.sectionDetailsHint}>
                     <div className="space-y-6">
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
                           rows={7}
                           touched={touched.description}
                           error={errors.description}
                        />
                     </div>
                  </FormSection>

                  <div className="flex flex-wrap items-center justify-end gap-3">
                     <Link
                        href="/panel/tickets"
                        className="rounded-full px-5 py-2.5 text-sm font-bold text-navy-600 transition-colors hover:bg-surface-muted dark:text-navy-300 dark:hover:bg-navy-800"
                     >
                        {fa.common.cancel}
                     </Link>
                     <button
                        type="submit"
                        disabled={isSubmitting || categories.length === 0}
                        className="rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                     >
                        {isSubmitting ? fa.tickets.create.submitting : fa.tickets.create.submit}
                     </button>
                  </div>
               </>
            )}
         </FormShell>
      </div>
   )
}
