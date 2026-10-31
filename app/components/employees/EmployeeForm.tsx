"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
   ArrowRightIcon,
   BriefcaseIcon,
   BuildingOffice2Icon,
   IdentificationIcon,
   PencilSquareIcon,
   UserCircleIcon,
} from "@heroicons/react/24/outline"
import type { FormikHelpers } from "formik"
import { FormShell } from "@/app/components/auth/FormShell"
import PageHero from "@/app/components/ui/PageHero"
import StepForm, { type StepFormStep } from "@/app/components/ui/StepForm"
import InputField from "@/app/components/ui/InputField"
import JalaliDateField from "@/app/components/ui/JalaliDateField"
import PasswordField from "@/app/components/ui/PasswordField"
import SelectField from "@/app/components/ui/SelectField"
import TextareaField from "@/app/components/ui/TextareaField"
import AdminNotice from "@/app/components/ui/AdminNotice"
import GeneratedPasswordDialog from "@/app/components/ui/GeneratedPasswordDialog"
import { ApiError, patchJson, postJson } from "@/app/helpers/API"
import { ROLE_ORDER } from "@/lib/auth/permissions"
import { fa } from "@/lib/i18n/fa"
import {
   createEmployeeSchema,
   updateEmployeeSchema,
   EMPLOYMENT_TYPES,
} from "@/lib/employees/validation"
import type { AdminEmployeeDto, EmployeeDetailDto, EmployeeEmploymentType, EmployeeRole, EmployeeStatus } from "@/lib/employees/types"

interface EmployeeFormValues {
   firstName: string
   lastName: string
   username: string
   phone: string
   role: string
   status: string
   password: string
   personnelCode: string
   nationalId: string
   jobTitle: string
   orgUnitName: string
   floor: string
   roomNumber: string
   employmentType: string
   hireDate: string
   notes: string
}

interface EmployeeFormProps {
   mode: "create" | "edit"
   employee?: EmployeeDetailDto
   isSelf?: boolean
}

export default function EmployeeForm({ mode, employee, isSelf = false }: EmployeeFormProps) {
   const router = useRouter()
   const [formError, setFormError] = useState<string | null>(null)
   const [generated, setGenerated] = useState<{ id: string; username: string; password: string } | null>(null)
   const [validateAfterSubmit, setValidateAfterSubmit] = useState(false)

   const initialValues: EmployeeFormValues = {
      firstName: employee?.firstName ?? "",
      lastName: employee?.lastName ?? "",
      username: employee?.username ?? "",
      phone: employee?.phone ?? "",
      role: employee?.role ?? "EMPLOYEE",
      status: employee?.status ?? "ACTIVE",
      password: "",
      personnelCode: employee?.profile?.personnelCode ?? "",
      nationalId: employee?.profile?.nationalId ?? "",
      jobTitle: employee?.profile?.jobTitle ?? "",
      orgUnitName: employee?.profile?.orgUnit?.name ?? "",
      floor: employee?.profile?.location?.floor ?? "",
      roomNumber: employee?.profile?.location?.roomNumber ?? "",
      employmentType: employee?.profile?.employmentType ?? "",
      hireDate: employee?.profile?.hireDate ? employee.profile.hireDate.slice(0, 10) : "",
      notes: employee?.profile?.notes ?? "",
   }

   const handleSubmit = async (values: EmployeeFormValues, helpers: FormikHelpers<EmployeeFormValues>) => {
      setFormError(null)

      const payload = {
         firstName: values.firstName.trim(),
         lastName: values.lastName.trim(),
         username: values.username.trim().toLowerCase(),
         phone: values.phone.trim(),
         role: values.role as EmployeeRole,
         status: values.status as EmployeeStatus,
         personnelCode: values.personnelCode.trim(),
         nationalId: values.nationalId.trim(),
         jobTitle: values.jobTitle.trim(),
         orgUnitName: values.orgUnitName.trim(),
         floor: values.floor.trim(),
         roomNumber: values.roomNumber.trim(),
         employmentType: values.employmentType as EmployeeEmploymentType | "",
         hireDate: values.hireDate,
         notes: values.notes.trim(),
      }

      try {
         if (mode === "create") {
            const result = await postJson<{ employee: AdminEmployeeDto; initialPassword?: string }>(
               "/api/admin/users",
               { ...payload, password: values.password },
            )
            if (result.initialPassword) {
               setGenerated({
                  id: result.employee.id,
                  username: result.employee.username,
                  password: result.initialPassword,
               })
            } else {
               router.push(`/admin/employees/${result.employee.id}`)
               router.refresh()
            }
         } else if (employee) {
            await patchJson<{ employee: AdminEmployeeDto }>(`/api/admin/users/${employee.id}`, payload)
            router.push(`/admin/employees/${employee.id}`)
            router.refresh()
         }
      } catch (err) {
         if (err instanceof ApiError) {
            if (err.errors && Object.keys(err.errors).length > 0) {
               helpers.setErrors(err.errors)
               setFormError(fa.employees.form.formError)
            } else if (err.code === "self_protected" || err.code === "SELF") {
               setFormError(fa.admin.selfProtected)
            } else if (err.code === "last_admin" || err.code === "LAST_ADMIN") {
               setFormError(fa.admin.lastAdmin)
            } else {
               setFormError(fa.employees.form.formError)
            }
         } else {
            console.error("employee save failed", err)
            setFormError(fa.employees.form.formError)
         }
      } finally {
         helpers.setSubmitting(false)
      }
   }

   return (
      <div className="space-y-6">
         <PageHero
            badge={mode === "create" ? fa.employees.workspaceLabel : fa.employees.editEmployee}
            title={mode === "create" ? fa.employees.form.createTitle : fa.employees.form.editTitle}
            description={mode === "create" ? fa.employees.form.createDescription : fa.employees.form.editDescription}
            tone="admin"
            actions={
               <Link
                  href={employee ? `/admin/employees/${employee.id}` : "/admin/employees"}
                  className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-2.5 text-sm font-bold text-navy-700 transition-colors hover:border-brand-400 hover:text-brand-800 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200"
               >
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  {fa.common.back}
               </Link>
            }
         />

         {formError ? <AdminNotice tone="error">{formError}</AdminNotice> : null}
         {isSelf ? <AdminNotice tone="info">{fa.admin.selfProtected}</AdminNotice> : null}

         <FormShell<EmployeeFormValues>
            initialValues={initialValues}
            validationSchema={mode === "create" ? createEmployeeSchema : updateEmployeeSchema}
            onSubmit={handleSubmit}
            validateOnChange={validateAfterSubmit}
            validateOnBlur={validateAfterSubmit}
            className="space-y-5"
         >
            {({ touched, errors }) => {
               const steps: StepFormStep[] = [
                  {
                     id: "identity",
                     title: fa.employees.form.sectionIdentity,
                     hint: fa.employees.form.sectionIdentityHint,
                     icon: <IdentificationIcon className="h-5 w-5" aria-hidden="true" />,
                     errorKeys: ["firstName", "lastName", "personnelCode", "nationalId", "jobTitle"],
                     content: (
                        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                           <InputField
                              name="firstName"
                              label={fa.employees.form.firstName}
                              placeholder={fa.employees.form.firstNamePlaceholder}
                              autoComplete="given-name"
                              touched={touched.firstName}
                              error={errors.firstName}
                           />
                           <InputField
                              name="lastName"
                              label={fa.employees.form.lastName}
                              placeholder={fa.employees.form.lastNamePlaceholder}
                              autoComplete="family-name"
                              touched={touched.lastName}
                              error={errors.lastName}
                           />
                           <InputField
                              name="personnelCode"
                              label={fa.employees.form.personnelCode}
                              placeholder={fa.employees.form.personnelCodePlaceholder}
                              autoComplete="off"
                              dir="ltr"
                              touched={touched.personnelCode}
                              error={errors.personnelCode}
                           />
                           <InputField
                              name="nationalId"
                              label={fa.employees.form.nationalId}
                              placeholder={fa.employees.form.nationalIdPlaceholder}
                              autoComplete="off"
                              dir="ltr"
                              touched={touched.nationalId}
                              error={errors.nationalId}
                           />
                           <InputField
                              name="jobTitle"
                              label={fa.employees.form.jobTitle}
                              placeholder={fa.employees.form.jobTitlePlaceholder}
                              autoComplete="organization-title"
                              className="sm:col-span-2"
                              touched={touched.jobTitle}
                              error={errors.jobTitle}
                           />
                        </div>
                     ),
                  },
                  {
                     id: "account",
                     title: fa.employees.form.sectionAccount,
                     hint: fa.employees.form.sectionAccountHint,
                     icon: <UserCircleIcon className="h-5 w-5" aria-hidden="true" />,
                     errorKeys: ["username", "phone", "role", "status", "password"],
                     content: (
                        <>
                           <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                              <InputField
                                 name="username"
                                 label={fa.employees.form.username}
                                 placeholder={fa.employees.form.usernamePlaceholder}
                                 autoComplete="off"
                                 dir="ltr"
                                 hint={fa.authPages.usernameHint}
                                 touched={touched.username}
                                 error={errors.username}
                              />
                              <InputField
                                 name="phone"
                                 label={fa.employees.form.phone}
                                 placeholder={fa.employees.form.phonePlaceholder}
                                 type="tel"
                                 autoComplete="off"
                                 dir="ltr"
                                 touched={touched.phone}
                                 error={errors.phone}
                              />
                              <SelectField
                                 name="role"
                                 label={fa.employees.form.role}
                                 options={ROLE_ORDER.map((role) => ({ value: role, label: fa.roles[role] ?? role }))}
                                 disabled={isSelf}
                                 touched={touched.role}
                                 error={errors.role}
                              />
                              <SelectField
                                 name="status"
                                 label={fa.employees.form.status}
                                 options={[
                                    { value: "ACTIVE", label: fa.employees.statuses.ACTIVE },
                                    { value: "SUSPENDED", label: fa.employees.statuses.SUSPENDED },
                                 ]}
                                 disabled={isSelf}
                                 touched={touched.status}
                                 error={errors.status}
                              />
                           </div>

                           {mode === "create" ? (
                              <div className="mt-6">
                                 <PasswordField
                                    name="password"
                                    label={fa.employees.form.password}
                                    hint={fa.employees.form.passwordHint}
                                    autoComplete="new-password"
                                    touched={touched.password}
                                    error={errors.password}
                                 />
                              </div>
                           ) : null}
                        </>
                     ),
                  },
                  {
                     id: "organization",
                     title: fa.employees.form.sectionOrganization,
                     hint: fa.employees.form.sectionOrganizationHint,
                     icon: <BuildingOffice2Icon className="h-5 w-5" aria-hidden="true" />,
                     errorKeys: ["orgUnitName", "floor", "roomNumber"],
                     content: (
                        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                           <InputField
                              name="orgUnitName"
                              label={fa.employees.form.orgUnitName}
                              placeholder={fa.employees.form.orgUnitNamePlaceholder}
                              hint={fa.employees.form.orgUnitNameHint}
                              autoComplete="organization"
                              touched={touched.orgUnitName}
                              error={errors.orgUnitName}
                           />
                           <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                              <InputField
                                 name="floor"
                                 label={fa.employees.form.floor}
                                 placeholder={fa.employees.form.floorPlaceholder}
                                 touched={touched.floor}
                                 error={errors.floor}
                              />
                              <InputField
                                 name="roomNumber"
                                 label={fa.employees.form.roomNumber}
                                 placeholder={fa.employees.form.roomNumberPlaceholder}
                                 touched={touched.roomNumber}
                                 error={errors.roomNumber}
                              />
                           </div>
                           <p className="text-xs leading-6 text-navy-500 dark:text-navy-400 sm:col-span-2">
                              {fa.employees.form.locationHint}
                           </p>
                        </div>
                     ),
                  },
                  {
                     id: "employment",
                     title: fa.employees.form.sectionEmployment,
                     hint: fa.employees.form.sectionEmploymentHint,
                     icon: <BriefcaseIcon className="h-5 w-5" aria-hidden="true" />,
                     errorKeys: ["employmentType", "hireDate"],
                     content: (
                        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                           <SelectField
                              name="employmentType"
                              label={fa.employees.form.employmentType}
                              placeholder={fa.employees.form.employmentTypePlaceholder}
                              options={EMPLOYMENT_TYPES.map((type) => ({
                                 value: type,
                                 label: fa.employees.employmentTypes[type] ?? type,
                              }))}
                              touched={touched.employmentType}
                              error={errors.employmentType}
                           />
                           <JalaliDateField
                              name="hireDate"
                              label={fa.employees.form.hireDate}
                              touched={touched.hireDate}
                              error={errors.hireDate}
                           />
                        </div>
                     ),
                  },
                  {
                     id: "notes",
                     title: fa.employees.form.sectionNotes,
                     icon: <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />,
                     errorKeys: ["notes"],
                     content: (
                        <TextareaField
                           name="notes"
                           label={fa.employees.form.notes}
                           placeholder={fa.employees.form.notesPlaceholder}
                           rows={4}
                           touched={touched.notes}
                           error={errors.notes}
                        />
                     ),
                  },
               ]

               return (
                  <StepForm
                     steps={steps}
                     cancelHref={employee ? `/admin/employees/${employee.id}` : "/admin/employees"}
                     cancelLabel={fa.employees.form.cancel}
                     submitLabel={mode === "create" ? fa.employees.form.createAction : fa.employees.form.saveAction}
                     submittingLabel={fa.employees.form.saving}
                     onSubmitAttempt={() => setValidateAfterSubmit(true)}
                  />
               )
            }}
         </FormShell>

         {generated ? (
            <GeneratedPasswordDialog
               username={generated.username}
               password={generated.password}
               onClose={() => {
                  router.push(`/admin/employees/${generated.id}`)
                  router.refresh()
               }}
            />
         ) : null}
      </div>
   )
}
