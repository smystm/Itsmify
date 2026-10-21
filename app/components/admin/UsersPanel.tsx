"use client"

import { useEffect, useId, useMemo, useState, type ReactNode } from "react"
import { motion } from "motion/react"
import { Field, ErrorMessage, type FormikHelpers } from "formik"
import * as yup from "yup"
import {
   ArrowPathIcon,
   CheckIcon,
   ClipboardDocumentIcon,
   KeyIcon,
   MagnifyingGlassIcon,
   PencilSquareIcon,
   PlusIcon,
   TrashIcon,
   UsersIcon,
   XMarkIcon,
} from "@heroicons/react/24/outline"
import AdminNotice from "@/app/components/ui/AdminNotice"
import EmptyState from "@/app/components/ui/EmptyState"
import StatusBadge from "@/app/components/ui/StatusBadge"
import InputField from "@/app/components/ui/InputField"
import PasswordField from "@/app/components/ui/PasswordField"
import Button from "@/app/components/ui/Button"
import { FormShell } from "@/app/components/auth/FormShell"
import { ApiError, deleteJson, getJson, patchJson, postJson } from "@/app/helpers/API"
import { ROLE_ORDER } from "@/lib/auth/permissions"
import { isValidPhone } from "@/lib/auth/phone"
import { fa } from "@/lib/i18n/fa"
import type { AdminRole, AdminStatus, AdminUser } from "./types"

type StatusFilter = "ALL" | AdminStatus

const STATUS_FILTERS: StatusFilter[] = ["ALL", "ACTIVE", "SUSPENDED"]
const STATUS_OPTIONS: AdminStatus[] = ["ACTIVE", "SUSPENDED"]

interface UsersPanelProps {
   currentUserId: string
}

/**
 * Administrator user management.
 *
 * All decisions are server-side: this component starts requests, renders the
 * returned projection, and never receives a password hash. Passwords are only
 * visible once, in the response that created or reset them.
 */
export default function UsersPanel({ currentUserId }: UsersPanelProps) {
   const [users, setUsers] = useState<AdminUser[] | null>(null)
   const [error, setError] = useState<string | null>(null)
   const [notice, setNotice] = useState<string | null>(null)

   const [query, setQuery] = useState("")
   const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
   const [archived, setArchived] = useState(false)

   const [creating, setCreating] = useState(false)
   const [editing, setEditing] = useState<AdminUser | null>(null)
   const [resetting, setResetting] = useState<AdminUser | null>(null)
   const [deleting, setDeleting] = useState<AdminUser | null>(null)
   const [generated, setGenerated] = useState<{ username: string; password: string } | null>(null)
   const [actionBusy, setActionBusy] = useState(false)

   const listUrl = archived ? "/api/admin/users?archived=1" : "/api/admin/users"

   useEffect(() => {
      let cancelled = false

      void getJson<{ users: AdminUser[] }>(listUrl)
         .then((data) => {
            if (cancelled) return
            setUsers(data.users)
            setError(null)
         })
         .catch((err) => {
            if (cancelled) return
            console.error("users load failed", err)
            setError(fa.admin.genericError)
         })

      return () => {
         cancelled = true
      }
   }, [listUrl])

   const refresh = async () => {
      try {
         const data = await getJson<{ users: AdminUser[] }>(listUrl)
         setUsers(data.users)
         setError(null)
      } catch (err) {
         console.error("users refresh failed", err)
         setError(fa.admin.genericError)
      }
   }

   const filtered = useMemo(() => {
      if (users === null) return null

      const term = query.trim().toLowerCase()
      return users.filter((user) => {
         if (statusFilter !== "ALL" && user.status !== statusFilter) return false
         if (term.length === 0) return true
         const haystack = [user.firstName, user.lastName, user.username, user.phone ?? ""].join(" ").toLowerCase()
         return haystack.includes(term)
      })
   }, [users, query, statusFilter])

   const toggleArchived = () => {
      setArchived((current) => !current)
      setUsers(null)
      setError(null)
   }

   const handleSaved = async (result: { user: AdminUser; initialPassword?: string }) => {
      setCreating(false)
      setEditing(null)
      setNotice(fa.admin.createdNotice)
      if (result.initialPassword) {
         setGenerated({ username: result.user.username, password: result.initialPassword })
      }
      await refresh()
   }

   const confirmReset = async () => {
      if (!resetting) return
      setActionBusy(true)
      setError(null)
      try {
         const data = await postJson<{ username: string; password: string }>(
            `/api/admin/users/${resetting.id}/password`,
            {},
         )
         setResetting(null)
         setGenerated({ username: data.username, password: data.password })
         setNotice(fa.admin.resetDoneNotice)
      } catch (err) {
         console.error("password reset failed", err)
         setError(errorText(err))
         setResetting(null)
      } finally {
         setActionBusy(false)
      }
   }

   const confirmDelete = async () => {
      if (!deleting) return
      setActionBusy(true)
      setError(null)
      try {
         await deleteJson(`/api/admin/users/${deleting.id}`)
         setDeleting(null)
         setNotice(fa.admin.deletedNotice)
         await refresh()
      } catch (err) {
         console.error("user delete failed", err)
         setError(errorText(err))
         setDeleting(null)
      } finally {
         setActionBusy(false)
      }
   }

   return (
      <div className="space-y-5">
         {notice ? <AdminNotice tone="success">{notice}</AdminNotice> : null}
         {error ? <AdminNotice tone="error">{error}</AdminNotice> : null}

         <div className="animate-fade-in-up flex flex-wrap items-center gap-2">
            <div className="relative flex min-w-0 flex-1 items-center">
               <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 start-3 flex w-6 items-center justify-center text-navy-500"
               >
                  <MagnifyingGlassIcon className="h-5 w-5" />
               </span>
               <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={fa.admin.searchHint}
                  aria-label={fa.admin.searchHint}
                  className="w-full rounded-full border border-border-subtle bg-surface px-4 pe-11 py-2.5 text-sm font-medium text-navy-800 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50 dark:focus:border-brand-400"
               />
            </div>

            <div className="flex shrink-0 gap-1 rounded-full bg-surface-muted p-1 dark:bg-navy-800">
               {STATUS_FILTERS.map((filter) => (
                  <button
                     key={filter}
                     type="button"
                     onClick={() => setStatusFilter(filter)}
                     className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                        statusFilter === filter
                           ? "bg-surface text-brand-800 shadow-sm dark:bg-navy-900 dark:text-brand-200"
                           : "text-navy-600 hover:text-brand-700 dark:text-navy-300 dark:hover:text-brand-200"
                     }`}
                  >
                     {filter === "ALL" ? fa.admin.statusFilterAll : fa.admin.statuses[filter]}
                  </button>
               ))}
            </div>

            <button
               type="button"
               onClick={toggleArchived}
               className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-2.5 text-xs font-bold text-navy-700 transition-colors hover:border-brand-400 hover:text-brand-800 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200 dark:hover:text-brand-200"
            >
               {archived ? fa.admin.showActive : fa.admin.showArchived}
            </button>

            <button
               type="button"
               onClick={() => void refresh()}
               aria-label={fa.admin.reload}
               className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface text-navy-600 transition-colors hover:border-brand-400 hover:text-brand-700 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-300"
            >
               <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
            </button>

            {!archived ? (
               <button
                  type="button"
                  onClick={() => {
                     setNotice(null)
                     setCreating(true)
                  }}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all duration-300 hover:brightness-110"
               >
                  <PlusIcon className="h-5 w-5" aria-hidden="true" />
                  {fa.admin.createUser}
               </button>
            ) : null}
         </div>

         <div className="animate-fade-in-up">
            {users === null && !error ? (
               <p className="py-8 text-center text-sm text-navy-500 dark:text-navy-300">{fa.admin.loading}</p>
            ) : null}

            {filtered !== null && filtered.length === 0 ? (
               <EmptyState
                  icon={<UsersIcon className="h-6 w-6" />}
                  title={
                     archived
                        ? fa.admin.emptyArchived
                        : query.trim().length > 0
                          ? fa.admin.searchEmptyWithTitle
                          : fa.admin.emptyUsers
                  }
                  body={
                     archived
                        ? fa.admin.emptyArchivedBody
                        : query.trim().length > 0
                          ? fa.admin.searchEmptyBody
                          : fa.admin.emptyUsersBody
                  }
                  tone="brand"
               />
            ) : null}

            {filtered !== null && filtered.length > 0 ? (
               <ul
                  role="list"
                  className="divide-y divide-border-subtle overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-xl shadow-navy-900/5 dark:shadow-black/20"
               >
                  {filtered.map((user, index) => (
                     <UserRow
                        key={user.id}
                        user={user}
                        isSelf={user.id === currentUserId}
                        archived={archived}
                        onEdit={() => {
                           setNotice(null)
                           setEditing(user)
                        }}
                        onReset={() => {
                           setNotice(null)
                           setResetting(user)
                        }}
                        onDelete={() => {
                           setNotice(null)
                           setDeleting(user)
                        }}
                        delay={index * 0.035}
                     />
                  ))}
               </ul>
            ) : null}
         </div>

         {creating ? (
            <UserFormDialog
               key="create"
               mode="create"
               isSelf={false}
               onClose={() => setCreating(false)}
               onSaved={handleSaved}
            />
         ) : null}

         {editing ? (
            <UserFormDialog
               key={editing.id}
               mode="edit"
               user={editing}
               isSelf={editing.id === currentUserId}
               onClose={() => setEditing(null)}
               onSaved={handleSaved}
            />
         ) : null}

         {resetting ? (
            <ConfirmDialog
               title={fa.admin.resetConfirmTitle}
               body={fa.admin.resetConfirmBody.replace(
                  "{name}",
                  `${resetting.firstName} ${resetting.lastName}`.trim(),
               )}
               confirmLabel={fa.admin.resetConfirmAction}
               busy={actionBusy}
               onClose={() => setResetting(null)}
               onConfirm={confirmReset}
            />
         ) : null}

         {deleting ? (
            <ConfirmDialog
               title={fa.admin.deleteConfirmTitle}
               body={fa.admin.deleteConfirmBody.replace(
                  "{name}",
                  `${deleting.firstName} ${deleting.lastName}`.trim(),
               )}
               confirmLabel={fa.admin.deleteConfirmAction}
               busy={actionBusy}
               destructive
               onClose={() => setDeleting(null)}
               onConfirm={confirmDelete}
            />
         ) : null}

         {generated ? (
            <GeneratedPasswordDialog
               key={`${generated.username}:${generated.password}`}
               username={generated.username}
               password={generated.password}
               onClose={() => setGenerated(null)}
            />
         ) : null}
      </div>
   )
}

function errorText(err: unknown): string {
   if (err instanceof ApiError) {
      if (err.code === "SELF") return fa.admin.selfProtected
      if (err.code === "LAST_ADMIN") return fa.admin.lastAdmin
   }
   return fa.admin.genericError
}

interface UserRowProps {
   user: AdminUser
   isSelf: boolean
   archived: boolean
   onEdit: () => void
   onReset: () => void
   onDelete: () => void
   delay: number
}

function UserRow({ user, isSelf, archived, onEdit, onReset, onDelete, delay }: UserRowProps) {
   const displayName = `${user.firstName} ${user.lastName}`.trim() || user.username

   return (
      <motion.li
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
         className="p-5 transition-colors hover:bg-surface-muted/60 dark:hover:bg-navy-900/40"
      >
         <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
               <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-sm font-extrabold text-navy-950 dark:text-white">{displayName}</p>
                  <StatusBadge
                     tone={user.status === "ACTIVE" ? "approved" : "rejected"}
                     label={fa.admin.statuses[user.status] ?? user.status}
                  />
                  {isSelf ? (
                     <span className="rounded-full bg-accent-500/15 px-2.5 py-0.5 text-[10px] font-bold text-accent-800 dark:text-accent-200">
                        {fa.admin.selfBadge}
                     </span>
                  ) : null}
                  {archived ? (
                     <span className="rounded-full bg-red-500/12 px-2.5 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-200">
                        {fa.admin.archivedBadge}
                     </span>
                  ) : null}
               </div>

               <p dir="ltr" className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-navy-500 dark:text-navy-400">
                  <span>{user.username}</span>
                  <span>·</span>
                  <span>{user.phone ?? fa.admin.phoneNotSet}</span>
                  {user.phone ? (
                     <>
                        <span>·</span>
                        <span>{user.phoneVerifiedAt ? fa.admin.phoneVerified : fa.admin.phoneUnverified}</span>
                     </>
                  ) : null}
               </p>

               <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-500 dark:text-navy-400">
                  <span>{fa.roles[user.role] ?? user.role}</span>
                  <span>
                     {fa.admin.createdAt.replace("{date}", new Date(user.createdAt).toLocaleDateString("fa-IR"))}
                  </span>
                  <span>
                     {user.lastLoginAt
                        ? fa.admin.lastLogin.replace("{date}", new Date(user.lastLoginAt).toLocaleString("fa-IR"))
                        : fa.admin.never}
                  </span>
               </p>
            </div>

            {!archived ? (
               <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <RowAction
                     icon={<PencilSquareIcon className="h-4 w-4" aria-hidden="true" />}
                     label={fa.admin.editUser}
                     onClick={onEdit}
                  />
                  <RowAction
                     icon={<KeyIcon className="h-4 w-4" aria-hidden="true" />}
                     label={fa.admin.resetPassword}
                     onClick={onReset}
                     disabled={isSelf}
                     title={isSelf ? fa.admin.selfResetBlocked : undefined}
                  />
                  <RowAction
                     icon={<TrashIcon className="h-4 w-4" aria-hidden="true" />}
                     label={fa.admin.deleteUser}
                     onClick={onDelete}
                     disabled={isSelf}
                     destructive
                     title={isSelf ? fa.admin.selfProtected : undefined}
                  />
               </div>
            ) : null}
         </div>
      </motion.li>
   )
}

function RowAction({
   icon,
   label,
   onClick,
   disabled = false,
   destructive = false,
   title,
}: {
   icon: ReactNode
   label: string
   onClick: () => void
   disabled?: boolean
   destructive?: boolean
   title?: string
}) {
   return (
      <button
         type="button"
         onClick={onClick}
         disabled={disabled}
         title={title}
         className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            destructive
               ? "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-200 dark:hover:bg-red-500/10"
               : "border-border-subtle text-navy-700 hover:border-brand-400 hover:text-brand-800 dark:border-navy-700 dark:text-navy-200 dark:hover:text-brand-200"
         }`}
      >
         {icon}
         {label}
      </button>
   )
}

interface UserFormValues {
   firstName: string
   lastName: string
   username: string
   phone: string
   role: AdminRole
   status: AdminStatus
   password: string
}

const strongPassword = /^(?=.*[A-Za-z])(?=.*[0-9]).{10,128}$/

const userFormSchema = yup.object({
   firstName: yup
      .string()
      .trim()
      .required(fa.admin.firstNameRequired)
      .min(2, fa.admin.firstNameMin),
   lastName: yup.string().trim().required(fa.admin.lastNameRequired).min(2, fa.admin.lastNameMin),
   username: yup
      .string()
      .trim()
      .required(fa.admin.usernameRequired)
      .min(3, fa.admin.usernameMin)
      .max(32, fa.admin.usernameMax)
      .matches(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/, fa.admin.usernameFormat)
      .transform((value) => (typeof value === "string" ? value.toLowerCase() : value)),
   phone: yup
      .string()
      .trim()
      .default("")
      .test("phone-valid", fa.profile.phoneInvalid, (value) => !value || isValidPhone(value)),
   role: yup.string().oneOf([...ROLE_ORDER]).required(),
   status: yup.string().oneOf(STATUS_OPTIONS).required(),
   password: yup
      .string()
      .default("")
      .test("password-policy", fa.admin.passwordPolicy, (value) => !value || strongPassword.test(value)),
})

function UserFormDialog({
   mode,
   user,
   isSelf,
   onClose,
   onSaved,
}: {
   mode: "create" | "edit"
   user?: AdminUser
   isSelf: boolean
   onClose: () => void
   onSaved: (result: { user: AdminUser; initialPassword?: string }) => void | Promise<void>
}) {
   const [formError, setFormError] = useState<string | null>(null)

   const initialValues: UserFormValues = {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      username: user?.username ?? "",
      phone: user?.phone ?? "",
      role: user?.role ?? "EMPLOYEE",
      status: user?.status ?? "ACTIVE",
      password: "",
   }

   const handleSubmit = async (values: UserFormValues, helpers: FormikHelpers<UserFormValues>) => {
      setFormError(null)

      const payload = {
         firstName: values.firstName.trim(),
         lastName: values.lastName.trim(),
         username: values.username.trim().toLowerCase(),
         phone: values.phone.trim(),
         role: values.role,
         status: values.status,
      }

      try {
         if (mode === "create") {
            const data = await postJson<{ user: AdminUser; initialPassword?: string }>("/api/admin/users", {
               ...payload,
               password: values.password,
            })
            await onSaved(data)
         } else if (user) {
            const data = await patchJson<{ user: AdminUser }>(`/api/admin/users/${user.id}`, payload)
            await onSaved(data)
         }
      } catch (err) {
         if (err instanceof ApiError) {
            if (err.errors && Object.keys(err.errors).length > 0) {
               helpers.setErrors(err.errors)
            } else if (err.code === "SELF") {
               setFormError(fa.admin.selfProtected)
            } else if (err.code === "LAST_ADMIN") {
               setFormError(fa.admin.lastAdmin)
            } else {
               setFormError(fa.admin.genericError)
            }
         } else {
            console.error("user save failed", err)
            setFormError(fa.admin.genericError)
         }
      } finally {
         helpers.setSubmitting(false)
      }
   }

   return (
      <Modal
         title={mode === "create" ? fa.admin.createDialogTitle : fa.admin.editDialogTitle}
         description={mode === "create" ? fa.admin.createDialogDescription : fa.admin.editDialogDescription}
         onClose={onClose}
         wide
      >
         <FormShell<UserFormValues>
            initialValues={initialValues}
            validationSchema={userFormSchema}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
         >
            {({ isSubmitting, touched, errors }) => (
               <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                     <InputField
                        name="firstName"
                        label={fa.admin.firstName}
                        placeholder={fa.admin.firstNamePlaceholder}
                        autoComplete="given-name"
                        touched={touched.firstName}
                        error={errors.firstName}
                     />
                     <InputField
                        name="lastName"
                        label={fa.admin.lastName}
                        placeholder={fa.admin.lastNamePlaceholder}
                        autoComplete="family-name"
                        touched={touched.lastName}
                        error={errors.lastName}
                     />
                  </div>

                  <InputField
                     name="username"
                     label={fa.admin.username}
                     placeholder={fa.admin.usernamePlaceholder}
                     autoComplete="off"
                     dir="ltr"
                     hint={fa.authPages.usernameHint}
                     touched={touched.username}
                     error={errors.username}
                  />

                  <InputField
                     name="phone"
                     label={fa.admin.phoneOptional}
                     placeholder={fa.admin.phonePlaceholder}
                     type="tel"
                     dir="ltr"
                     autoComplete="off"
                     touched={touched.phone}
                     error={errors.phone}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                     <div>
                        <label htmlFor="role" className="mb-1.5 block text-sm font-bold text-navy-800 dark:text-navy-200">
                           {fa.admin.roleLabel}
                        </label>
                        <Field
                           as="select"
                           id="role"
                           name="role"
                           disabled={isSelf}
                           className="w-full rounded-xl border border-navy-300 bg-surface px-4 py-3 text-sm font-bold text-navy-900 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
                        >
                           {ROLE_ORDER.map((role) => (
                              <option key={role} value={role}>
                                 {fa.roles[role] ?? role}
                              </option>
                           ))}
                        </Field>
                        <ErrorMessage name="role" component="p" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400" />
                     </div>

                     <div>
                        <label htmlFor="status" className="mb-1.5 block text-sm font-bold text-navy-800 dark:text-navy-200">
                           {fa.admin.statusLabel}
                        </label>
                        <Field
                           as="select"
                           id="status"
                           name="status"
                           disabled={isSelf}
                           className="w-full rounded-xl border border-navy-300 bg-surface px-4 py-3 text-sm font-bold text-navy-900 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
                        >
                           {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                 {fa.admin.statuses[status]}
                              </option>
                           ))}
                        </Field>
                        <ErrorMessage
                           name="status"
                           component="p"
                           className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400"
                        />
                     </div>
                  </div>

                  {isSelf ? (
                     <p className="rounded-xl bg-accent-500/10 px-4 py-3 text-xs leading-6 text-accent-900 dark:text-accent-100">
                        {fa.admin.selfProtected}
                     </p>
                  ) : null}

                  {mode === "create" ? (
                     <PasswordField
                        name="password"
                        label={fa.admin.initialPassword}
                        hint={fa.admin.initialPasswordHint}
                        autoComplete="new-password"
                        touched={touched.password}
                        error={errors.password}
                     />
                  ) : null}

                  {formError ? <AdminNotice tone="error">{formError}</AdminNotice> : null}

                  <div className="mt-2 flex flex-wrap justify-end gap-3">
                     <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full px-5 py-2.5 text-sm font-bold text-navy-600 transition-colors hover:bg-surface-muted dark:text-navy-300 dark:hover:bg-navy-800"
                     >
                        {fa.admin.cancel}
                     </button>
                     <Button type="submit" disabled={isSubmitting} fullWidth={false}>
                        {isSubmitting ? fa.admin.saving : fa.admin.save}
                     </Button>
                  </div>
               </>
            )}
         </FormShell>
      </Modal>
   )
}

function Modal({
   title,
   description,
   children,
   onClose,
   wide = false,
}: {
   title: string
   description?: string
   children: ReactNode
   onClose: () => void
   wide?: boolean
}) {
   const titleId = useId()

   return (
      <div
         className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-950/60 p-4 backdrop-blur-sm sm:items-center"
         role="presentation"
         onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
         }}
      >
         <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={`my-8 w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-3xl border border-border-subtle bg-surface p-6 shadow-2xl shadow-navy-950/30 dark:border-navy-700 dark:bg-navy-900 sm:p-8`}
         >
            <div className="mb-5 flex items-start justify-between gap-4">
               <div>
                  <h2 id={titleId} className="text-xl font-extrabold text-navy-950 dark:text-white">
                     {title}
                  </h2>
                  {description ? (
                     <p className="mt-1.5 text-sm leading-6 text-navy-600 dark:text-navy-300">{description}</p>
                  ) : null}
               </div>
               <button
                  type="button"
                  onClick={onClose}
                  aria-label={fa.admin.close}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-navy-500 transition-colors hover:bg-surface-muted hover:text-navy-800 dark:text-navy-300 dark:hover:bg-navy-800 dark:hover:text-white"
               >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
               </button>
            </div>

            {children}
         </div>
      </div>
   )
}

function ConfirmDialog({
   title,
   body,
   confirmLabel,
   busy,
   destructive = false,
   onConfirm,
   onClose,
}: {
   title: string
   body: string
   confirmLabel: string
   busy: boolean
   destructive?: boolean
   onConfirm: () => void | Promise<void>
   onClose: () => void
}) {
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

function GeneratedPasswordDialog({
   username,
   password,
   onClose,
}: {
   username: string
   password: string
   onClose: () => void
}) {
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
      <Modal title={fa.admin.generatedPasswordTitle} description={fa.admin.generatedPasswordBody} onClose={onClose}>
         <p className="text-xs font-bold text-navy-500 dark:text-navy-400">
            {fa.admin.generatedPasswordFor.replace("{username}", username)}
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
               aria-label={fa.admin.copyPassword}
               className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-surface text-brand-700 transition-colors hover:border-brand-400 dark:border-navy-700 dark:bg-navy-900 dark:text-brand-200"
            >
               {copied ? (
                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
               ) : (
                  <ClipboardDocumentIcon className="h-5 w-5" aria-hidden="true" />
               )}
            </button>
         </div>

         {copied ? <p className="mt-2 text-xs font-bold text-brand-700 dark:text-brand-200">{fa.admin.passwordCopied}</p> : null}

         <p className="mt-4 rounded-xl border border-accent-500/25 bg-accent-500/10 px-4 py-3 text-xs leading-6 text-accent-900 dark:text-accent-100">
            {fa.admin.generatedPasswordBody}
         </p>

         <div className="mt-6 flex justify-end">
            <Button type="button" onClick={onClose} fullWidth={false}>
               {fa.admin.done}
            </Button>
         </div>
      </Modal>
   )
}
