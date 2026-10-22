"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
   ArrowRightIcon,
   CheckCircleIcon,
   ClockIcon,
   KeyIcon,
   NoSymbolIcon,
   PencilSquareIcon,
   TrashIcon,
} from "@heroicons/react/24/outline"
import PageHero, { AvatarTile } from "@/app/components/ui/PageHero"
import StatStrip from "@/app/components/ui/StatStrip"
import FormSection from "@/app/components/ui/FormSection"
import AdminNotice from "@/app/components/ui/AdminNotice"
import StatusBadge from "@/app/components/ui/StatusBadge"
import EmptyState from "@/app/components/ui/EmptyState"
import ConfirmDialog from "@/app/components/ui/ConfirmDialog"
import GeneratedPasswordDialog from "@/app/components/ui/GeneratedPasswordDialog"
import { ApiError, deleteJson, patchJson, postJson } from "@/app/helpers/API"
import { formatJalaliDate, formatJalaliDateTime } from "@/lib/date/jalali"
import { fa } from "@/lib/i18n/fa"
import type { EmployeeDetailDto } from "@/lib/employees/types"

interface EmployeeProfileViewProps {
   employee: EmployeeDetailDto
   currentUserId: string
   canWrite: boolean
   canDelete: boolean
}

export default function EmployeeProfileView({ employee, currentUserId, canWrite, canDelete }: EmployeeProfileViewProps) {
   const router = useRouter()
   const [notice, setNotice] = useState<string | null>(null)
   const [error, setError] = useState<string | null>(null)
   const [resetting, setResetting] = useState(false)
   const [statusOpen, setStatusOpen] = useState(false)
   const [deleting, setDeleting] = useState(false)
   const [busy, setBusy] = useState(false)
   const [generated, setGenerated] = useState<{ username: string; password: string } | null>(null)

   const isSelf = employee.id === currentUserId
   const archived = Boolean(employee.deletedAt)
   const displayName = `${employee.firstName} ${employee.lastName}`.trim() || employee.username
   const location = employee.profile?.location
   const orgUnit = employee.profile?.orgUnit
   const activeAssets = employee.assets.length

   const resetPassword = async () => {
      setBusy(true)
      setError(null)
      try {
         const result = await postJson<{ username: string; password: string }>(
            `/api/admin/users/${employee.id}/password`,
            {},
         )
         setResetting(false)
         setGenerated({ username: result.username, password: result.password })
         setNotice(fa.employees.profile.resetDone)
      } catch (err) {
         setError(actionError(err))
      } finally {
         setBusy(false)
      }
   }

   const changeStatus = async () => {
      setBusy(true)
      setError(null)
      try {
         await patchJson(`/api/admin/users/${employee.id}/status`, {
            status: employee.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
         })
         setStatusOpen(false)
         setNotice(
            employee.status === "ACTIVE"
               ? fa.employees.profile.statusChangeDoneSuspended
               : fa.employees.profile.statusChangeDoneActive,
         )
         router.refresh()
      } catch (err) {
         setError(actionError(err))
      } finally {
         setBusy(false)
      }
   }

   const removeEmployee = async () => {
      setBusy(true)
      setError(null)
      try {
         await deleteJson(`/api/admin/users/${employee.id}`)
         setDeleting(false)
         router.push("/admin/employees")
         router.refresh()
      } catch (err) {
         setError(actionError(err))
      } finally {
         setBusy(false)
      }
   }

   return (
      <div className="space-y-6">
         <PageHero
            badge={fa.employees.profile.accountTitle}
            title={displayName}
            description={`${employee.username}${employee.profile?.jobTitle ? ` · ${employee.profile.jobTitle}` : ""}`}
            leading={<AvatarTile displayName={displayName} tone="admin" />}
            tone="admin"
            actions={
               <div className="flex flex-wrap gap-2">
                  <Link
                     href="/admin/employees"
                     className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-2.5 text-sm font-bold text-navy-700 transition-colors hover:border-brand-400 hover:text-brand-800 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200"
                  >
                     <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                     {fa.employees.profile.back}
                  </Link>
                  {canWrite && !archived ? (
                     <Link
                        href={`/admin/employees/${employee.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all hover:brightness-110"
                     >
                        <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                        {fa.employees.profile.editAction}
                     </Link>
                  ) : null}
               </div>
            }
         />

         {notice ? <AdminNotice tone="success">{notice}</AdminNotice> : null}
         {error ? <AdminNotice tone="error">{error}</AdminNotice> : null}
         {archived ? <AdminNotice tone="info">{fa.employees.archivedBadge}</AdminNotice> : null}

         <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
               tone={employee.status === "ACTIVE" ? "approved" : "rejected"}
               label={fa.employees.statuses[employee.status] ?? employee.status}
            />
            <span className="rounded-full bg-brand-500/12 px-3 py-1 text-xs font-bold text-brand-700 dark:text-brand-200">
               {fa.roles[employee.role] ?? employee.role}
            </span>
            {isSelf ? (
               <span className="rounded-full bg-accent-500/15 px-3 py-1 text-xs font-bold text-accent-800 dark:text-accent-100">
                  {fa.employees.selfBadge}
               </span>
            ) : null}
         </div>

         <StatStrip
            columns={4}
            items={[
               {
                  value: activeAssets.toLocaleString("fa-IR"),
                  label: fa.employees.profile.currentAssets,
                  icon: <CheckCircleIcon className="h-5 w-5" />,
               },
               {
                  value: employee.profile?.personnelCode ?? "—",
                  label: fa.employees.profile.personnelCode,
                  dir: "ltr",
               },
               {
                  value: orgUnit?.name ?? "—",
                  label: fa.employees.profile.orgUnit,
               },
               {
                  value: employee.lastLoginAt ? formatJalaliDate(employee.lastLoginAt) : fa.employees.never,
                  label: fa.employees.profile.lastLogin,
                  icon: <ClockIcon className="h-5 w-5" />,
               },
            ]}
         />

         <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
               <FormSection title={fa.employees.profile.organizationTitle} hint={fa.employees.profile.organizationDescription}>
                  <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                     <InfoRow label={fa.employees.profile.personnelCode} value={employee.profile?.personnelCode} ltr />
                     <InfoRow label={fa.employees.profile.nationalId} value={employee.profile?.nationalId} ltr />
                     <InfoRow label={fa.employees.profile.jobTitle} value={employee.profile?.jobTitle} />
                     <InfoRow
                        label={fa.employees.profile.employmentType}
                        value={employee.profile?.employmentType ? fa.employees.employmentTypes[employee.profile.employmentType] : null}
                     />
                     <InfoRow
                        label={fa.employees.profile.hireDate}
                        value={employee.profile?.hireDate ? formatJalaliDate(employee.profile.hireDate) : null}
                     />
                     <InfoRow label={fa.employees.profile.orgUnit} value={orgUnit?.name} />
                     <InfoRow
                        label={fa.employees.profile.location}
                        value={location ? `${location.floor} / ${location.roomNumber}` : null}
                     />
                  </div>
                  {employee.profile?.notes ? (
                     <div className="mt-5 rounded-2xl bg-surface-muted/70 px-4 py-3 dark:bg-navy-900/50">
                        <p className="text-xs font-bold text-navy-500 dark:text-navy-400">{fa.employees.profile.notes}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-navy-700 dark:text-navy-200">
                           {employee.profile.notes}
                        </p>
                     </div>
                  ) : null}
               </FormSection>

               <FormSection title={fa.employees.profile.assetsTitle} hint={fa.employees.profile.assetsDescription}>
                  {employee.assets.length === 0 ? (
                     <EmptyState
                        icon={<CheckCircleIcon className="h-6 w-6" />}
                        title={fa.employees.profile.noAssetsTitle}
                        body={fa.employees.profile.noAssetsBody}
                        tone="brand"
                     />
                  ) : (
                     <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-right text-sm">
                           <thead className="text-[11px] font-bold text-navy-500 dark:text-navy-400">
                              <tr>
                                 <th className="pb-3 pe-4">{fa.employees.profile.assetColumns.code}</th>
                                 <th className="pb-3 pe-4">{fa.employees.profile.assetColumns.name}</th>
                                 <th className="pb-3 pe-4">{fa.employees.profile.assetColumns.category}</th>
                                 <th className="pb-3 pe-4">{fa.employees.profile.assetColumns.status}</th>
                                 <th className="pb-3">{fa.employees.profile.assetColumns.assignedAt}</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-border-subtle">
                              {employee.assets.map((assignment) => (
                                 <tr key={assignment.assignmentId}>
                                    <td className="py-3 pe-4">
                                       <Link
                                          href={`/admin/assets/${assignment.asset.id}`}
                                          dir="ltr"
                                          className="font-mono text-xs font-bold text-brand-700 hover:underline dark:text-brand-200"
                                       >
                                          {assignment.asset.assetCode}
                                       </Link>
                                    </td>
                                    <td className="py-3 pe-4">
                                       <Link href={`/admin/assets/${assignment.asset.id}`} className="font-bold text-navy-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-200">
                                          {assignment.asset.name}
                                       </Link>
                                    </td>
                                    <td className="py-3 pe-4 text-xs text-navy-600 dark:text-navy-300">
                                       {fa.assets.categories[assignment.asset.category] ?? assignment.asset.category}
                                    </td>
                                    <td className="py-3 pe-4">
                                       <StatusBadge
                                          tone={assignment.asset.status === "ACTIVE" ? "approved" : assignment.asset.status === "IN_REPAIR" ? "pending" : "neutral"}
                                          label={fa.assets.statuses[assignment.asset.status] ?? assignment.asset.status}
                                       />
                                    </td>
                                    <td className="py-3 text-xs text-navy-600 dark:text-navy-300">
                                       {formatJalaliDate(assignment.assignedAt)}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  )}
               </FormSection>

               <FormSection title={fa.employees.profile.historyTitle} hint={fa.employees.profile.historyDescription}>
                  {employee.audit.length === 0 ? (
                     <EmptyState
                        icon={<ClockIcon className="h-6 w-6" />}
                        title={fa.employees.profile.noHistoryTitle}
                        body={fa.employees.profile.noHistoryBody}
                        tone="accent"
                     />
                  ) : (
                     <ol className="relative space-y-4 border-s border-border-subtle ps-5 dark:border-navy-700">
                        {employee.audit.map((item) => (
                           <li key={item.id} className="relative">
                              <span aria-hidden="true" className="absolute -start-[1.55rem] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-500 ring-4 ring-surface dark:ring-navy-900" />
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                 <p className="text-sm font-bold text-navy-900 dark:text-white">
                                    {fa.employees.profile.auditActions[item.action] ?? item.action}
                                 </p>
                                 <time className="text-xs text-navy-500 dark:text-navy-400">
                                    {formatJalaliDateTime(item.createdAt)}
                                 </time>
                              </div>
                              <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                                 {item.actorName ?? fa.employees.profile.auditActorSystem}
                              </p>
                           </li>
                        ))}
                     </ol>
                  )}
               </FormSection>
            </div>

            <aside className="space-y-6">
               <FormSection title={fa.employees.profile.accountTitle} hint={fa.employees.profile.accountDescription}>
                  <div className="space-y-4">
                     <InfoRow label={fa.employees.profile.role} value={fa.roles[employee.role] ?? employee.role} />
                     <InfoRow label={fa.employees.profile.status} value={fa.employees.statuses[employee.status] ?? employee.status} />
                     <InfoRow label={fa.employees.form.username} value={employee.username} ltr />
                     <InfoRow label={fa.employees.profile.phone} value={employee.phone} ltr />
                     {employee.phone ? (
                        <InfoRow
                           label={fa.employees.profile.phoneVerified}
                           value={employee.phoneVerifiedAt ? fa.employees.profile.phoneVerified : fa.employees.profile.phoneUnverified}
                        />
                     ) : null}
                     <InfoRow label={fa.employees.profile.lastLogin} value={employee.lastLoginAt ? formatJalaliDateTime(employee.lastLoginAt) : fa.employees.never} />
                     <InfoRow label={fa.employees.profile.createdAt} value={formatJalaliDate(employee.createdAt)} />
                  </div>

                  {employee.mustChangePassword ? (
                     <p className="mt-4 rounded-xl bg-accent-500/10 px-3 py-2 text-xs font-bold leading-6 text-accent-900 dark:text-accent-100">
                        {fa.employees.profile.mustChangePassword}
                     </p>
                  ) : null}

                  {canWrite && !archived && !isSelf ? (
                     <div className="mt-5 space-y-2 border-t border-border-subtle pt-4">
                        <button
                           type="button"
                           onClick={() => {
                              setError(null)
                              setResetting(true)
                           }}
                           className="flex w-full items-center gap-2 rounded-xl border border-border-subtle px-3 py-2.5 text-xs font-bold text-navy-700 transition-colors hover:border-brand-400 hover:text-brand-800 dark:border-navy-700 dark:text-navy-200"
                        >
                           <KeyIcon className="h-4 w-4" aria-hidden="true" />
                           {fa.employees.profile.resetPassword}
                        </button>
                        <button
                           type="button"
                           onClick={() => {
                              setError(null)
                              setStatusOpen(true)
                           }}
                           className="flex w-full items-center gap-2 rounded-xl border border-border-subtle px-3 py-2.5 text-xs font-bold text-navy-700 transition-colors hover:border-accent-400 hover:text-accent-800 dark:border-navy-700 dark:text-navy-200"
                        >
                           {employee.status === "ACTIVE" ? <NoSymbolIcon className="h-4 w-4" aria-hidden="true" /> : <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />}
                           {employee.status === "ACTIVE" ? fa.employees.profile.suspend : fa.employees.profile.activate}
                        </button>
                        {canDelete ? (
                           <button
                              type="button"
                              onClick={() => {
                                 setError(null)
                                 setDeleting(true)
                              }}
                              className="flex w-full items-center gap-2 rounded-xl border border-red-300 px-3 py-2.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-50 dark:border-red-500/40 dark:text-red-200 dark:hover:bg-red-500/10"
                           >
                              <TrashIcon className="h-4 w-4" aria-hidden="true" />
                              {fa.employees.profile.delete}
                           </button>
                        ) : null}
                     </div>
                  ) : null}
               </FormSection>
            </aside>
         </div>

         {resetting ? (
            <ConfirmDialog
               title={fa.admin.resetConfirmTitle}
               body={fa.admin.resetConfirmBody.replace("{name}", displayName)}
               confirmLabel={fa.admin.resetConfirmAction}
               busy={busy}
               onClose={() => setResetting(false)}
               onConfirm={resetPassword}
            />
         ) : null}

         {statusOpen ? (
            <ConfirmDialog
               title={fa.employees.profile.statusChangeTitle}
               body={fa.employees.profile.statusChangeBody.replace("{name}", displayName)}
               confirmLabel={employee.status === "ACTIVE" ? fa.employees.profile.suspend : fa.employees.profile.activate}
               busy={busy}
               destructive={employee.status === "ACTIVE"}
               onClose={() => setStatusOpen(false)}
               onConfirm={changeStatus}
            />
         ) : null}

         {deleting ? (
            <ConfirmDialog
               title={fa.employees.profile.deleteTitle}
               body={fa.employees.profile.deleteBody.replace("{name}", displayName)}
               confirmLabel={fa.employees.profile.deleteAction}
               busy={busy}
               destructive
               onClose={() => setDeleting(false)}
               onConfirm={removeEmployee}
            />
         ) : null}

         {generated ? (
            <GeneratedPasswordDialog
               username={generated.username}
               password={generated.password}
               onClose={() => {
                  setGenerated(null)
                  router.refresh()
               }}
            />
         ) : null}
      </div>
   )
}

function InfoRow({ label, value, ltr = false }: { label: string; value: string | null | undefined; ltr?: boolean }) {
   return (
      <div>
         <dt className="text-xs font-medium text-navy-500 dark:text-navy-400">{label}</dt>
         <dd
            dir={ltr ? "ltr" : undefined}
            className={`mt-1 text-sm font-bold text-navy-900 dark:text-navy-100 ${ltr ? "font-mono" : ""}`.trim()}
         >
            {value || "—"}
         </dd>
      </div>
   )
}

function actionError(err: unknown): string {
   if (err instanceof ApiError) {
      if (err.code === "self_protected" || err.code === "SELF") return fa.admin.selfProtected
      if (err.code === "last_admin" || err.code === "LAST_ADMIN") return fa.admin.lastAdmin
      if (err.code === "assets_assigned") {
         const count = typeof err.details?.count === "number" ? err.details.count : 0
         return fa.employees.profile.assetsAssignedError.replace("{count}", count.toLocaleString("fa-IR"))
      }
      if (err.code === "self_password_reset") return fa.admin.selfResetBlocked
   }
   return fa.admin.genericError
}
