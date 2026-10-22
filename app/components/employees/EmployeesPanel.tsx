"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import {
   ArrowPathIcon,
   CheckCircleIcon,
   KeyIcon,
   MagnifyingGlassIcon,
   NoSymbolIcon,
   PencilSquareIcon,
   PlusIcon,
   TrashIcon,
   UsersIcon,
} from "@heroicons/react/24/outline"
import PageHero from "@/app/components/ui/PageHero"
import AdminNotice, { SkeletonBlock } from "@/app/components/ui/AdminNotice"
import EmptyState from "@/app/components/ui/EmptyState"
import StatusBadge from "@/app/components/ui/StatusBadge"
import FilterSelect from "@/app/components/ui/FilterSelect"
import Pagination from "@/app/components/ui/Pagination"
import ConfirmDialog from "@/app/components/ui/ConfirmDialog"
import GeneratedPasswordDialog from "@/app/components/ui/GeneratedPasswordDialog"
import { ApiError, deleteJson, getJson, patchJson, postJson } from "@/app/helpers/API"
import { ROLE_ORDER } from "@/lib/auth/permissions"
import { formatJalaliDate } from "@/lib/date/jalali"
import { fa } from "@/lib/i18n/fa"
import type { AdminEmployeeDto, EmployeeListResponse } from "@/lib/employees/types"

interface EmployeesPanelProps {
   currentUserId: string
}

interface OrgUnitOption {
   id: string
   name: string
}

/**
 * Employee directory UI. List filtering and pagination are server-side so the
 * browser never downloads the whole directory just to hide rows locally.
 */
export default function EmployeesPanel({ currentUserId }: EmployeesPanelProps) {
   const [data, setData] = useState<EmployeeListResponse | null>(null)
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
   const [notice, setNotice] = useState<string | null>(null)
   const [refreshKey, setRefreshKey] = useState(0)

   const [query, setQuery] = useState("")
   const [debouncedQuery, setDebouncedQuery] = useState("")
   const [role, setRole] = useState("")
   const [status, setStatus] = useState("")
   const [orgUnitId, setOrgUnitId] = useState("")
   const [sort, setSort] = useState("newest")
   const [archived, setArchived] = useState(false)
   const [page, setPage] = useState(1)
   const [orgUnits, setOrgUnits] = useState<OrgUnitOption[]>([])

   const [resetting, setResetting] = useState<AdminEmployeeDto | null>(null)
   const [statusTarget, setStatusTarget] = useState<AdminEmployeeDto | null>(null)
   const [deleting, setDeleting] = useState<AdminEmployeeDto | null>(null)
   const [generated, setGenerated] = useState<{ username: string; password: string } | null>(null)
   const [actionBusy, setActionBusy] = useState(false)
   const [actionError, setActionError] = useState<string | null>(null)

   useEffect(() => {
      const timer = window.setTimeout(() => {
         setDebouncedQuery(query)
         setPage(1)
      }, 300)
      return () => window.clearTimeout(timer)
   }, [query])

   useEffect(() => {
      let cancelled = false
      void getJson<{ orgUnits: OrgUnitOption[] }>("/api/admin/employees/options")
         .then((result) => {
            if (!cancelled) setOrgUnits(result.orgUnits)
         })
         .catch(() => {
            // The filter simply stays empty; the directory itself still works.
         })
      return () => {
         cancelled = true
      }
   }, [])

   useEffect(() => {
      const controller = new AbortController()
      /* eslint-disable react-hooks/set-state-in-effect -- entering a request is an intentional transition */
      setLoading(true)
      setError(null)
      /* eslint-enable react-hooks/set-state-in-effect */

      const params = new URLSearchParams()
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim())
      if (role) params.set("role", role)
      if (status) params.set("status", status)
      if (orgUnitId) params.set("orgUnitId", orgUnitId)
      if (archived) params.set("archived", "1")
      params.set("page", String(page))
      params.set("pageSize", "20")
      params.set("sort", sort)

      void getJson<EmployeeListResponse>(`/api/admin/users?${params.toString()}`, controller.signal)
         .then((result) => {
            setData(result)
            setError(null)
            if (result.totalPages > 0 && page > result.totalPages) setPage(result.totalPages)
         })
         .catch((err) => {
            if (controller.signal.aborted) return
            console.error("employee list load failed", err)
            setError(fa.employees.loadError)
         })
         .finally(() => {
            if (!controller.signal.aborted) setLoading(false)
         })

      return () => controller.abort()
   }, [debouncedQuery, role, status, orgUnitId, archived, page, sort, refreshKey])

   const roleOptions = useMemo(
      () => [
         { value: "", label: fa.employees.allRoles },
         ...ROLE_ORDER.map((item) => ({ value: item, label: fa.roles[item] ?? item })),
      ],
      [],
   )
   const statusOptions = [
      { value: "", label: fa.employees.allStatuses },
      { value: "ACTIVE", label: fa.employees.statuses.ACTIVE },
      { value: "SUSPENDED", label: fa.employees.statuses.SUSPENDED },
   ]
   const orgUnitOptions = [
      { value: "", label: fa.employees.allUnits },
      ...orgUnits.map((unit) => ({ value: unit.id, label: unit.name })),
   ]
   const sortOptions = [
      { value: "newest", label: fa.employees.sortNewest },
      { value: "oldest", label: fa.employees.sortOldest },
      { value: "name", label: fa.employees.sortName },
      { value: "lastLogin", label: fa.employees.sortLastLogin },
   ]

   const refresh = () => {
      setRefreshKey((current) => current + 1)
   }

   const confirmReset = async () => {
      if (!resetting) return
      setActionBusy(true)
      setActionError(null)
      try {
         const result = await postJson<{ username: string; password: string }>(
            `/api/admin/users/${resetting.id}/password`,
            {},
         )
         setResetting(null)
         setGenerated({ username: result.username, password: result.password })
         setNotice(fa.employees.profile.resetDone)
      } catch (err) {
         setActionError(employeeActionError(err))
      } finally {
         setActionBusy(false)
      }
   }

   const confirmStatus = async () => {
      if (!statusTarget) return
      setActionBusy(true)
      setActionError(null)
      try {
         await patchJson(`/api/admin/users/${statusTarget.id}/status`, {
            status: statusTarget.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
         })
         setStatusTarget(null)
         setNotice(
            statusTarget.status === "ACTIVE"
               ? fa.employees.profile.statusChangeDoneSuspended
               : fa.employees.profile.statusChangeDoneActive,
         )
         refresh()
      } catch (err) {
         setActionError(employeeActionError(err))
      } finally {
         setActionBusy(false)
      }
   }

   const confirmDelete = async () => {
      if (!deleting) return
      setActionBusy(true)
      setActionError(null)
      try {
         await deleteJson(`/api/admin/users/${deleting.id}`)
         setDeleting(null)
         setNotice(fa.admin.deletedNotice)
         refresh()
      } catch (err) {
         setActionError(employeeActionError(err))
      } finally {
         setActionBusy(false)
      }
   }

   const totalLabel = fa.employees.totalCount.replace(
      "{count}",
      (data?.total ?? 0).toLocaleString("fa-IR"),
   )

   return (
      <div className="space-y-6">
         <PageHero
            badge={fa.employees.workspaceLabel}
            title={fa.employees.pageTitle}
            description={fa.employees.pageDescription}
            tone="admin"
            actions={
               !archived ? (
                  <Link
                     href="/admin/employees/new"
                     className="inline-flex items-center gap-2 rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all duration-300 hover:brightness-110"
                  >
                     <PlusIcon className="h-5 w-5" aria-hidden="true" />
                     {fa.employees.newEmployee}
                  </Link>
               ) : null
            }
         />

         {notice ? <AdminNotice tone="success">{notice}</AdminNotice> : null}
         {error ? (
            <AdminNotice tone="error">
               <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>{error}</span>
                  <button type="button" onClick={refresh} className="font-bold underline underline-offset-4">
                     {fa.common.retry}
                  </button>
               </div>
            </AdminNotice>
         ) : null}

         <section className="animate-fade-in-up rounded-3xl border border-border-subtle bg-surface p-4 shadow-lg shadow-navy-900/5 dark:shadow-black/20 sm:p-5">
            <div className="flex flex-wrap items-end gap-3">
               <div className="relative min-w-[15rem] flex-1">
                  <span
                     aria-hidden="true"
                     className="pointer-events-none absolute inset-y-0 start-3 flex w-6 items-center justify-center text-navy-500"
                  >
                     <MagnifyingGlassIcon className="h-5 w-5" />
                  </span>
                  <label htmlFor="employee-search" className="mb-1 block text-[11px] font-bold text-navy-500 dark:text-navy-400">
                     {fa.common.search}
                  </label>
                  <input
                     id="employee-search"
                     type="search"
                     value={query}
                     onChange={(event) => setQuery(event.target.value)}
                     placeholder={fa.employees.searchPlaceholder}
                     className="w-full rounded-full border border-border-subtle bg-surface px-4 pe-11 py-2.5 text-sm font-medium text-navy-800 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
                  />
               </div>

               <FilterSelect label={fa.employees.columns.role} value={role} onChange={(value) => { setRole(value); setPage(1) }} options={roleOptions} />
               <FilterSelect label={fa.employees.columns.status} value={status} onChange={(value) => { setStatus(value); setPage(1) }} options={statusOptions} />
               <FilterSelect label={fa.employees.columns.orgUnit} value={orgUnitId} onChange={(value) => { setOrgUnitId(value); setPage(1) }} options={orgUnitOptions} />
               <FilterSelect label={fa.employees.sortLabel} value={sort} onChange={(value) => { setSort(value); setPage(1) }} options={sortOptions} />

               <button
                  type="button"
                  onClick={() => {
                     setArchived((current) => !current)
                     setPage(1)
                  }}
                  className={`rounded-full border px-4 py-2.5 text-xs font-bold transition-colors ${
                     archived
                        ? "border-accent-400 bg-accent-500/10 text-accent-900 dark:border-accent-500/40 dark:text-accent-100"
                        : "border-border-subtle bg-surface text-navy-700 hover:border-brand-400 hover:text-brand-800 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200"
                  }`}
               >
                  {archived ? fa.employees.hideArchived : fa.employees.showArchived}
               </button>

               <button
                  type="button"
                  onClick={refresh}
                  aria-label={fa.common.retry}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface text-navy-600 transition-colors hover:border-brand-400 hover:text-brand-700 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-300"
               >
                  <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
               </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-navy-500 dark:text-navy-400">
               <span>{totalLabel}</span>
               <span>{loading ? fa.employees.loading : fa.employees.pageOf.replace("{page}", String(data?.page ?? page)).replace("{pages}", String(data?.totalPages ?? 0))}</span>
            </div>
         </section>

         {actionError ? <AdminNotice tone="error">{actionError}</AdminNotice> : null}

         {loading && !data ? (
            <div className="space-y-3">
               <SkeletonBlock className="h-20" />
               <SkeletonBlock className="h-20" />
               <SkeletonBlock className="h-20" />
               <SkeletonBlock className="h-20" />
            </div>
         ) : null}

         {!loading && data && data.employees.length === 0 ? (
            <EmptyState
               icon={<UsersIcon className="h-6 w-6" />}
               title={
                  archived
                     ? fa.employees.archivedEmptyTitle
                     : debouncedQuery || role || status || orgUnitId
                       ? fa.employees.searchEmptyTitle
                       : fa.employees.emptyTitle
               }
               body={
                  archived
                     ? fa.employees.archivedEmptyBody
                     : debouncedQuery || role || status || orgUnitId
                       ? fa.employees.searchEmptyBody
                       : fa.employees.emptyBody
               }
               action={!archived ? { label: fa.employees.newEmployee, href: "/admin/employees/new" } : undefined}
               tone="brand"
            />
         ) : null}

         {data && data.employees.length > 0 ? (
            <>
               <div className="hidden overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-xl shadow-navy-900/5 dark:shadow-black/20 md:block">
                  <div className="overflow-x-auto">
                     <table className="w-full min-w-[900px] text-right text-sm">
                        <thead className="bg-surface-muted/80 text-[11px] font-bold uppercase tracking-wide text-navy-500 dark:bg-navy-900/60 dark:text-navy-400">
                           <tr>
                              <th className="px-5 py-4">{fa.employees.columns.employee}</th>
                              <th className="px-4 py-4">{fa.employees.columns.role}</th>
                              <th className="px-4 py-4">{fa.employees.columns.orgUnit}</th>
                              <th className="px-4 py-4">{fa.employees.columns.assets}</th>
                              <th className="px-4 py-4">{fa.employees.columns.status}</th>
                              <th className="px-4 py-4">{fa.employees.columns.lastLogin}</th>
                              <th className="px-5 py-4 text-center">{fa.employees.columns.actions}</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                           {data.employees.map((employee) => (
                              <EmployeeTableRow
                                 key={employee.id}
                                 employee={employee}
                                 isSelf={employee.id === currentUserId}
                                 archived={archived}
                                 onReset={() => { setActionError(null); setResetting(employee) }}
                                 onStatus={() => { setActionError(null); setStatusTarget(employee) }}
                                 onDelete={() => { setActionError(null); setDeleting(employee) }}
                              />
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

               <div className="space-y-3 md:hidden">
                  {data.employees.map((employee) => (
                     <EmployeeCard
                        key={employee.id}
                        employee={employee}
                        isSelf={employee.id === currentUserId}
                        archived={archived}
                        onReset={() => { setActionError(null); setResetting(employee) }}
                        onStatus={() => { setActionError(null); setStatusTarget(employee) }}
                        onDelete={() => { setActionError(null); setDeleting(employee) }}
                     />
                  ))}
               </div>

               <Pagination
                  page={data.page}
                  totalPages={data.totalPages}
                  onPage={(next) => setPage(next)}
                  disabled={loading}
               />
            </>
         ) : null}

         {resetting ? (
            <ConfirmDialog
               title={fa.admin.resetConfirmTitle}
               body={fa.admin.resetConfirmBody.replace("{name}", displayName(resetting))}
               confirmLabel={fa.admin.resetConfirmAction}
               busy={actionBusy}
               onClose={() => setResetting(null)}
               onConfirm={confirmReset}
            />
         ) : null}

         {statusTarget ? (
            <ConfirmDialog
               title={fa.employees.profile.statusChangeTitle}
               body={fa.employees.profile.statusChangeBody.replace("{name}", displayName(statusTarget))}
               confirmLabel={
                  statusTarget.status === "ACTIVE" ? fa.employees.profile.suspend : fa.employees.profile.activate
               }
               busy={actionBusy}
               destructive={statusTarget.status === "ACTIVE"}
               onClose={() => setStatusTarget(null)}
               onConfirm={confirmStatus}
            />
         ) : null}

         {deleting ? (
            <ConfirmDialog
               title={fa.employees.profile.deleteTitle}
               body={fa.employees.profile.deleteBody.replace("{name}", displayName(deleting))}
               confirmLabel={fa.employees.profile.deleteAction}
               busy={actionBusy}
               destructive
               onClose={() => setDeleting(null)}
               onConfirm={confirmDelete}
            />
         ) : null}

         {generated ? (
            <GeneratedPasswordDialog
               username={generated.username}
               password={generated.password}
               onClose={() => setGenerated(null)}
            />
         ) : null}
      </div>
   )
}

function displayName(employee: Pick<AdminEmployeeDto, "firstName" | "lastName" | "username">): string {
   return `${employee.firstName} ${employee.lastName}`.trim() || employee.username
}

function initials(employee: Pick<AdminEmployeeDto, "firstName" | "lastName">): string {
   const value = `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`
   return value || fa.common.fallbackInitials
}

function formatDate(value: string | null): string {
   if (!value) return fa.employees.never
   return formatJalaliDate(value)
}

function employeeActionError(err: unknown): string {
   if (err instanceof ApiError) {
      if (err.code === "self_protected" || err.code === "SELF") return fa.admin.selfProtected
      if (err.code === "last_admin" || err.code === "LAST_ADMIN") return fa.admin.lastAdmin
      if (err.code === "assets_assigned") {
         const count = typeof err.details?.count === "number" ? err.details.count : 0
         return fa.employees.profile.assetsAssignedError.replace("{count}", count.toLocaleString("fa-IR"))
      }
      if (err.code === "not_found") return fa.employees.profile.notFoundBody
   }
   return fa.admin.genericError
}

function EmployeeTableRow({
   employee,
   isSelf,
   archived,
   onReset,
   onStatus,
   onDelete,
}: {
   employee: AdminEmployeeDto
   isSelf: boolean
   archived: boolean
   onReset: () => void
   onStatus: () => void
   onDelete: () => void
}) {
   return (
      <tr className="transition-colors hover:bg-surface-muted/50 dark:hover:bg-navy-900/30">
         <td className="px-5 py-4">
            <div className="flex items-center gap-3">
               <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-500/12 text-sm font-extrabold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                  {initials(employee)}
               </span>
               <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                     <Link href={`/admin/employees/${employee.id}`} className="font-extrabold text-navy-950 hover:text-brand-700 dark:text-white dark:hover:text-brand-200">
                        {displayName(employee)}
                     </Link>
                     {isSelf ? <TinyBadge tone="accent">{fa.employees.selfBadge}</TinyBadge> : null}
                     {archived ? <TinyBadge tone="red">{fa.employees.archivedBadge}</TinyBadge> : null}
                  </div>
                  <p dir="ltr" className="mt-0.5 truncate text-xs text-navy-500 dark:text-navy-400">
                     {employee.username}
                  </p>
               </div>
            </div>
         </td>
         <td className="px-4 py-4 text-xs font-bold text-navy-700 dark:text-navy-200">{fa.roles[employee.role] ?? employee.role}</td>
         <td className="px-4 py-4">
            <p className="max-w-[12rem] truncate text-xs font-bold text-navy-700 dark:text-navy-200">{employee.profile?.orgUnit?.name ?? "—"}</p>
            <p className="mt-0.5 text-[11px] text-navy-500 dark:text-navy-400">
               {employee.profile?.location ? `${employee.profile.location.floor} / ${employee.profile.location.roomNumber}` : "—"}
            </p>
         </td>
         <td className="px-4 py-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-navy-700 dark:bg-navy-800 dark:text-navy-200">
               {employee.profile?.activeAssetCount.toLocaleString("fa-IR") ?? "۰"}
            </span>
         </td>
         <td className="px-4 py-4">
            <StatusBadge
               tone={employee.status === "ACTIVE" ? "approved" : "rejected"}
               label={fa.employees.statuses[employee.status] ?? employee.status}
            />
         </td>
         <td className="px-4 py-4 text-xs text-navy-600 dark:text-navy-300">{formatDate(employee.lastLoginAt)}</td>
         <td className="px-5 py-4">
            <div className="flex items-center justify-end gap-1.5">
               <Link href={`/admin/employees/${employee.id}`} className="rounded-full border border-border-subtle p-2 text-navy-600 transition-colors hover:border-brand-400 hover:text-brand-700 dark:border-navy-700 dark:text-navy-300" aria-label={fa.employees.columns.employee} title={fa.employees.columns.employee}>
                  <UsersIcon className="h-4 w-4" aria-hidden="true" />
               </Link>
               {!archived ? (
                  <>
                     <Link href={`/admin/employees/${employee.id}/edit`} className="rounded-full border border-border-subtle p-2 text-navy-600 transition-colors hover:border-brand-400 hover:text-brand-700 dark:border-navy-700 dark:text-navy-300" aria-label={fa.employees.editEmployee} title={fa.employees.editEmployee}>
                        <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                     </Link>
                     <RowIcon label={fa.employees.profile.resetPassword} onClick={onReset} disabled={isSelf} tone="neutral">
                        <KeyIcon className="h-4 w-4" aria-hidden="true" />
                     </RowIcon>
                     <RowIcon
                        label={employee.status === "ACTIVE" ? fa.employees.profile.suspend : fa.employees.profile.activate}
                        onClick={onStatus}
                        disabled={isSelf}
                        tone={employee.status === "ACTIVE" ? "warning" : "success"}
                     >
                        {employee.status === "ACTIVE" ? <NoSymbolIcon className="h-4 w-4" aria-hidden="true" /> : <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />}
                     </RowIcon>
                     <RowIcon label={fa.employees.profile.delete} onClick={onDelete} disabled={isSelf} tone="danger">
                        <TrashIcon className="h-4 w-4" aria-hidden="true" />
                     </RowIcon>
                  </>
               ) : null}
            </div>
         </td>
      </tr>
   )
}

function EmployeeCard({
   employee,
   isSelf,
   archived,
   onReset,
   onStatus,
   onDelete,
}: {
   employee: AdminEmployeeDto
   isSelf: boolean
   archived: boolean
   onReset: () => void
   onStatus: () => void
   onDelete: () => void
}) {
   return (
      <article className="rounded-3xl border border-border-subtle bg-surface p-4 shadow-lg shadow-navy-900/5 dark:shadow-black/20">
         <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
               <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/12 text-sm font-extrabold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                  {initials(employee)}
               </span>
               <div className="min-w-0">
                  <Link href={`/admin/employees/${employee.id}`} className="truncate font-extrabold text-navy-950 hover:text-brand-700 dark:text-white dark:hover:text-brand-200">
                     {displayName(employee)}
                  </Link>
                  <p dir="ltr" className="mt-0.5 truncate text-xs text-navy-500 dark:text-navy-400">{employee.username}</p>
               </div>
            </div>
            <StatusBadge tone={employee.status === "ACTIVE" ? "approved" : "rejected"} label={fa.employees.statuses[employee.status] ?? employee.status} />
         </div>

         <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
               <dt className="text-navy-500 dark:text-navy-400">{fa.employees.columns.role}</dt>
               <dd className="mt-0.5 font-bold text-navy-800 dark:text-navy-100">{fa.roles[employee.role] ?? employee.role}</dd>
            </div>
            <div>
               <dt className="text-navy-500 dark:text-navy-400">{fa.employees.columns.assets}</dt>
               <dd className="mt-0.5 font-bold text-navy-800 dark:text-navy-100">{employee.profile?.activeAssetCount.toLocaleString("fa-IR") ?? "۰"}</dd>
            </div>
            <div>
               <dt className="text-navy-500 dark:text-navy-400">{fa.employees.columns.orgUnit}</dt>
               <dd className="mt-0.5 truncate font-bold text-navy-800 dark:text-navy-100">{employee.profile?.orgUnit?.name ?? "—"}</dd>
            </div>
            <div>
               <dt className="text-navy-500 dark:text-navy-400">{fa.employees.columns.lastLogin}</dt>
               <dd className="mt-0.5 font-bold text-navy-800 dark:text-navy-100">{formatDate(employee.lastLoginAt)}</dd>
            </div>
         </dl>

         <div className="mt-4 flex flex-wrap gap-2 border-t border-border-subtle pt-3">
            <Link href={`/admin/employees/${employee.id}`} className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-bold text-navy-700 dark:border-navy-700 dark:text-navy-200">
               {fa.employees.columns.employee}
            </Link>
            {!archived ? (
               <>
                  <Link href={`/admin/employees/${employee.id}/edit`} className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-bold text-navy-700 dark:border-navy-700 dark:text-navy-200">
                     {fa.common.edit}
                  </Link>
                  {!isSelf ? (
                     <>
                        <button type="button" onClick={onReset} className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-bold text-navy-700 dark:border-navy-700 dark:text-navy-200">
                           {fa.employees.profile.resetPassword}
                        </button>
                        <button type="button" onClick={onStatus} className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-bold text-navy-700 dark:border-navy-700 dark:text-navy-200">
                           {employee.status === "ACTIVE" ? fa.employees.profile.suspend : fa.employees.profile.activate}
                        </button>
                        <button type="button" onClick={onDelete} className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-bold text-red-700 dark:border-red-500/40 dark:text-red-200">
                           {fa.common.delete}
                        </button>
                     </>
                  ) : null}
               </>
            ) : null}
         </div>
      </article>
   )
}

function RowIcon({
   children,
   label,
   onClick,
   disabled = false,
   tone = "neutral",
}: {
   children: ReactNode
   label: string
   onClick: () => void
   disabled?: boolean
   tone?: "neutral" | "danger" | "warning" | "success"
}) {
   const tones = {
      neutral: "border-border-subtle text-navy-600 hover:border-brand-400 hover:text-brand-700 dark:border-navy-700 dark:text-navy-300",
      danger: "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-200 dark:hover:bg-red-500/10",
      warning: "border-accent-400 text-accent-800 hover:bg-accent-50 dark:border-accent-500/40 dark:text-accent-100 dark:hover:bg-accent-500/10",
      success: "border-brand-400 text-brand-700 hover:bg-brand-50 dark:border-brand-500/40 dark:text-brand-200 dark:hover:bg-brand-500/10",
   }
   return (
      <button
         type="button"
         onClick={onClick}
         disabled={disabled}
         aria-label={label}
         title={label}
         className={`rounded-full border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
      >
         {children}
      </button>
   )
}

function TinyBadge({ children, tone }: { children: ReactNode; tone: "accent" | "red" }) {
   return (
      <span
         className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            tone === "accent"
               ? "bg-accent-500/15 text-accent-800 dark:text-accent-100"
               : "bg-red-500/12 text-red-700 dark:text-red-200"
         }`}
      >
         {children}
      </span>
   )
}
