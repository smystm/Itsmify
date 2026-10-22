"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import {
   ArrowPathIcon,
   ArrowUturnLeftIcon,
   ComputerDesktopIcon,
   MagnifyingGlassIcon,
   PencilSquareIcon,
   PlusIcon,
   TrashIcon,
   UserPlusIcon,
} from "@heroicons/react/24/outline"
import PageHero from "@/app/components/ui/PageHero"
import AdminNotice, { SkeletonBlock } from "@/app/components/ui/AdminNotice"
import EmptyState from "@/app/components/ui/EmptyState"
import StatusBadge from "@/app/components/ui/StatusBadge"
import FilterSelect from "@/app/components/ui/FilterSelect"
import Pagination from "@/app/components/ui/Pagination"
import Modal from "@/app/components/ui/Modal"
import ConfirmDialog from "@/app/components/ui/ConfirmDialog"
import EmployeePicker from "./EmployeePicker"
import { ApiError, deleteJson, getJson, postJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import { ASSET_TYPES, TYPES_BY_CATEGORY, type AssetCategoryValue } from "@/lib/assets/validation"
import type { AssetListResponse, AssetSummaryDto } from "@/lib/assets/types"
import type { EmployeeLookupDto } from "@/lib/employees/types"

interface AssetsPanelProps {
   canWrite: boolean
   canDelete: boolean
}

export default function AssetsPanel({ canWrite, canDelete }: AssetsPanelProps) {
   const [data, setData] = useState<AssetListResponse | null>(null)
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
   const [notice, setNotice] = useState<string | null>(null)
   const [refreshKey, setRefreshKey] = useState(0)

   const [query, setQuery] = useState("")
   const [debouncedQuery, setDebouncedQuery] = useState("")
   const [category, setCategory] = useState("")
   const [type, setType] = useState("")
   const [status, setStatus] = useState("")
   const [assigned, setAssigned] = useState("")
   const [sort, setSort] = useState("newest")
   const [page, setPage] = useState(1)

   const [assigning, setAssigning] = useState<AssetSummaryDto | null>(null)
   const [assignEmployee, setAssignEmployee] = useState<EmployeeLookupDto | null>(null)
   const [assignNote, setAssignNote] = useState("")
   const [returning, setReturning] = useState<AssetSummaryDto | null>(null)
   const [returnNote, setReturnNote] = useState("")
   const [deleting, setDeleting] = useState<AssetSummaryDto | null>(null)
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
      const controller = new AbortController()
      /* eslint-disable react-hooks/set-state-in-effect -- entering a request is an intentional transition */
      setLoading(true)
      setError(null)
      /* eslint-enable react-hooks/set-state-in-effect */

      const params = new URLSearchParams()
      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim())
      if (category) params.set("category", category)
      if (type) params.set("type", type)
      if (status) params.set("status", status)
      if (assigned) params.set("assigned", assigned)
      params.set("page", String(page))
      params.set("pageSize", "20")
      params.set("sort", sort)

      void getJson<AssetListResponse>(`/api/admin/assets?${params.toString()}`, controller.signal)
         .then((result) => {
            setData(result)
            if (result.totalPages > 0 && page > result.totalPages) setPage(result.totalPages)
         })
         .catch((err) => {
            if (controller.signal.aborted) return
            console.error("asset list load failed", err)
            setError(fa.assets.loadError)
         })
         .finally(() => {
            if (!controller.signal.aborted) setLoading(false)
         })

      return () => controller.abort()
   }, [debouncedQuery, category, type, status, assigned, sort, page, refreshKey])

   const categoryOptions = [
      { value: "", label: fa.assets.allCategories },
      { value: "HARDWARE", label: fa.assets.categories.HARDWARE },
      { value: "SOFTWARE", label: fa.assets.categories.SOFTWARE },
      { value: "NETWORK", label: fa.assets.categories.NETWORK },
   ]
   const typeOptions = useMemo(() => {
      const types = category ? TYPES_BY_CATEGORY[category as AssetCategoryValue] ?? [] : ASSET_TYPES
      return [
         { value: "", label: fa.assets.allTypes },
         ...types.map((item) => ({ value: item, label: fa.assets.types[item] ?? item })),
      ]
   }, [category])
   const statusOptions = [
      { value: "", label: fa.assets.allStatuses },
      ...Object.entries(fa.assets.statuses).map(([value, label]) => ({ value, label })),
   ]
   const assignedOptions = [
      { value: "", label: fa.assets.allAssignees },
      { value: "assigned", label: fa.assets.assignedOnly },
      { value: "unassigned", label: fa.assets.unassignedOnly },
   ]
   const sortOptions = [
      { value: "newest", label: fa.assets.sortNewest },
      { value: "oldest", label: fa.assets.sortOldest },
      { value: "name", label: fa.assets.sortName },
      { value: "code", label: fa.assets.sortCode },
   ]

   const refresh = () => setRefreshKey((current) => current + 1)

   const changeCategory = (value: string) => {
      setCategory(value)
      if (value && type) {
         const allowed = TYPES_BY_CATEGORY[value as AssetCategoryValue] ?? []
         if (!allowed.includes(type as (typeof ASSET_TYPES)[number])) setType("")
      }
      setPage(1)
   }

   const openAssign = (asset: AssetSummaryDto) => {
      setActionError(null)
      setAssignEmployee(null)
      setAssignNote("")
      setAssigning(asset)
   }

   const openReturn = (asset: AssetSummaryDto) => {
      setActionError(null)
      setReturnNote("")
      setReturning(asset)
   }

   const confirmAssign = async () => {
      if (!assigning) return
      if (!assignEmployee) {
         setActionError(fa.assets.assign.invalidEmployee)
         return
      }
      setActionBusy(true)
      setActionError(null)
      try {
         await postJson(`/api/admin/assets/${assigning.id}/assign`, {
            employeeId: assignEmployee.profileId,
            note: assignNote,
         })
         setAssigning(null)
         setNotice(fa.assets.assign.done)
         refresh()
      } catch (err) {
         setActionError(assetActionError(err, "assign"))
      } finally {
         setActionBusy(false)
      }
   }

   const confirmReturn = async () => {
      if (!returning) return
      setActionBusy(true)
      setActionError(null)
      try {
         await postJson(`/api/admin/assets/${returning.id}/return`, { note: returnNote })
         setReturning(null)
         setNotice(fa.assets.assign.returnDone)
         refresh()
      } catch (err) {
         setActionError(assetActionError(err, "return"))
      } finally {
         setActionBusy(false)
      }
   }

   const confirmDelete = async () => {
      if (!deleting) return
      setActionBusy(true)
      setActionError(null)
      try {
         await deleteJson(`/api/admin/assets/${deleting.id}`)
         setDeleting(null)
         setNotice(fa.assets.detail.assetDeleted)
         refresh()
      } catch (err) {
         setActionError(assetActionError(err, "delete"))
      } finally {
         setActionBusy(false)
      }
   }

   const totalLabel = fa.assets.totalCount.replace("{count}", (data?.total ?? 0).toLocaleString("fa-IR"))

   return (
      <div className="space-y-6">
         <PageHero
            badge={fa.assets.workspaceLabel}
            title={fa.assets.pageTitle}
            description={fa.assets.pageDescription}
            tone="admin"
            actions={
               canWrite ? (
                  <Link
                     href="/admin/assets/new"
                     className="inline-flex items-center gap-2 rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all duration-300 hover:brightness-110"
                  >
                     <PlusIcon className="h-5 w-5" aria-hidden="true" />
                     {fa.assets.newAsset}
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
                  <label htmlFor="asset-search" className="mb-1 block text-[11px] font-bold text-navy-500 dark:text-navy-400">
                     {fa.common.search}
                  </label>
                  <input
                     id="asset-search"
                     type="search"
                     value={query}
                     onChange={(event) => setQuery(event.target.value)}
                     placeholder={fa.assets.searchPlaceholder}
                     className="w-full rounded-full border border-border-subtle bg-surface px-4 pe-11 py-2.5 text-sm font-medium text-navy-800 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
                  />
               </div>

               <FilterSelect label={fa.assets.columns.category} value={category} onChange={changeCategory} options={categoryOptions} />
               <FilterSelect label={fa.assets.columns.type} value={type} onChange={(value) => { setType(value); setPage(1) }} options={typeOptions} />
               <FilterSelect label={fa.assets.columns.status} value={status} onChange={(value) => { setStatus(value); setPage(1) }} options={statusOptions} />
               <FilterSelect label={fa.assets.columns.assignee} value={assigned} onChange={(value) => { setAssigned(value); setPage(1) }} options={assignedOptions} />
               <FilterSelect label={fa.assets.sortLabel} value={sort} onChange={(value) => { setSort(value); setPage(1) }} options={sortOptions} />

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
               <span>
                  {loading
                     ? fa.assets.loading
                     : fa.assets.pageOf.replace("{page}", String(data?.page ?? page)).replace("{pages}", String(data?.totalPages ?? 0))}
               </span>
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

         {!loading && data && data.assets.length === 0 ? (
            <EmptyState
               icon={<ComputerDesktopIcon className="h-6 w-6" />}
               title={debouncedQuery || category || type || status || assigned ? fa.assets.searchEmptyTitle : fa.assets.emptyTitle}
               body={debouncedQuery || category || type || status || assigned ? fa.assets.searchEmptyBody : fa.assets.emptyBody}
               action={canWrite ? { label: fa.assets.newAsset, href: "/admin/assets/new" } : undefined}
               tone="accent"
            />
         ) : null}

         {data && data.assets.length > 0 ? (
            <>
               <div className="hidden overflow-hidden rounded-3xl border border-border-subtle bg-surface shadow-xl shadow-navy-900/5 dark:shadow-black/20 md:block">
                  <div className="overflow-x-auto">
                     <table className="w-full min-w-[980px] text-right text-sm">
                        <thead className="bg-surface-muted/80 text-[11px] font-bold uppercase tracking-wide text-navy-500 dark:bg-navy-900/60 dark:text-navy-400">
                           <tr>
                              <th className="px-5 py-4">{fa.assets.columns.asset}</th>
                              <th className="px-4 py-4">{fa.assets.columns.category}</th>
                              <th className="px-4 py-4">{fa.assets.columns.assignee}</th>
                              <th className="px-4 py-4">{fa.assets.columns.location}</th>
                              <th className="px-4 py-4">{fa.assets.columns.status}</th>
                              <th className="px-4 py-4">{fa.assets.columns.serial}</th>
                              <th className="px-5 py-4 text-center">{fa.assets.columns.actions}</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                           {data.assets.map((asset) => (
                              <AssetTableRow
                                 key={asset.id}
                                 asset={asset}
                                 canWrite={canWrite}
                                 canDelete={canDelete}
                                 onAssign={() => openAssign(asset)}
                                 onReturn={() => openReturn(asset)}
                                 onDelete={() => {
                                    setActionError(null)
                                    setDeleting(asset)
                                 }}
                              />
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

               <div className="space-y-3 md:hidden">
                  {data.assets.map((asset) => (
                     <AssetCard
                        key={asset.id}
                        asset={asset}
                        canWrite={canWrite}
                        canDelete={canDelete}
                        onAssign={() => openAssign(asset)}
                        onReturn={() => openReturn(asset)}
                        onDelete={() => {
                           setActionError(null)
                           setDeleting(asset)
                        }}
                     />
                  ))}
               </div>

               <Pagination page={data.page} totalPages={data.totalPages} onPage={(next) => setPage(next)} disabled={loading} />
            </>
         ) : null}

         {assigning ? (
            <Modal
               title={fa.assets.assign.title}
               description={fa.assets.assign.description.replace("{name}", assigning.name)}
               onClose={() => setAssigning(null)}
            >
               <div className="space-y-4">
                  {assigning.currentAssignment ? (
                     <div className="rounded-2xl bg-surface-muted/70 px-4 py-3 text-xs dark:bg-navy-900/50">
                        <p className="font-bold text-navy-700 dark:text-navy-200">{fa.assets.detail.currentAssignee}</p>
                        <p className="mt-1 text-navy-600 dark:text-navy-300">
                           {assigning.currentAssignment.employee.firstName} {assigning.currentAssignment.employee.lastName}
                        </p>
                     </div>
                  ) : null}
                  <EmployeePicker value={assignEmployee?.profileId ?? ""} onChange={setAssignEmployee} />
                  <label className="block">
                     <span className="mb-1.5 block text-sm font-bold text-navy-800 dark:text-navy-200">
                        {fa.assets.assign.note}
                     </span>
                     <textarea
                        rows={3}
                        value={assignNote}
                        onChange={(event) => setAssignNote(event.target.value)}
                        placeholder={fa.assets.assign.notePlaceholder}
                        className="w-full resize-y rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm leading-6 text-navy-900 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
                     />
                  </label>
                  {actionError ? <AdminNotice tone="error">{actionError}</AdminNotice> : null}
                  <div className="flex justify-end gap-3">
                     <button type="button" onClick={() => setAssigning(null)} className="rounded-full px-4 py-2 text-sm font-bold text-navy-600 hover:bg-surface-muted dark:text-navy-300 dark:hover:bg-navy-800">
                        {fa.common.cancel}
                     </button>
                     <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => void confirmAssign()}
                        className="rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all hover:brightness-110 disabled:opacity-60"
                     >
                        {actionBusy ? fa.assets.assign.saving : fa.assets.assign.confirm}
                     </button>
                  </div>
               </div>
            </Modal>
         ) : null}

         {returning ? (
            <Modal
               title={fa.assets.assign.returnTitle}
               description={fa.assets.assign.returnDescription.replace("{name}", returning.name)}
               onClose={() => setReturning(null)}
            >
               <div className="space-y-4">
                  <label className="block">
                     <span className="mb-1.5 block text-sm font-bold text-navy-800 dark:text-navy-200">
                        {fa.assets.assign.returnNote}
                     </span>
                     <textarea
                        rows={3}
                        value={returnNote}
                        onChange={(event) => setReturnNote(event.target.value)}
                        className="w-full resize-y rounded-xl border border-border-subtle bg-surface px-4 py-3 text-sm leading-6 text-navy-900 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
                     />
                  </label>
                  {actionError ? <AdminNotice tone="error">{actionError}</AdminNotice> : null}
                  <div className="flex justify-end gap-3">
                     <button type="button" onClick={() => setReturning(null)} className="rounded-full px-4 py-2 text-sm font-bold text-navy-600 hover:bg-surface-muted dark:text-navy-300 dark:hover:bg-navy-800">
                        {fa.common.cancel}
                     </button>
                     <button
                        type="button"
                        disabled={actionBusy}
                        onClick={() => void confirmReturn()}
                        className="rounded-full bg-linear-to-l from-accent-600 to-accent-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent-700/25 transition-all hover:brightness-110 disabled:opacity-60"
                     >
                        {actionBusy ? fa.assets.assign.saving : fa.assets.assign.returnConfirm}
                     </button>
                  </div>
               </div>
            </Modal>
         ) : null}

         {deleting ? (
            <ConfirmDialog
               title={fa.assets.detail.deleteTitle}
               body={fa.assets.detail.deleteBody.replace("{name}", deleting.name)}
               confirmLabel={fa.assets.detail.deleteAction}
               busy={actionBusy}
               destructive
               onClose={() => setDeleting(null)}
               onConfirm={confirmDelete}
            />
         ) : null}
      </div>
   )
}

function assetTone(status: string): "approved" | "pending" | "rejected" | "neutral" | "info" {
   if (status === "ACTIVE") return "approved"
   if (status === "IN_REPAIR") return "pending"
   if (status === "LOST") return "rejected"
   if (status === "IN_STORAGE") return "info"
   return "neutral"
}

function AssetTableRow({
   asset,
   canWrite,
   canDelete,
   onAssign,
   onReturn,
   onDelete,
}: {
   asset: AssetSummaryDto
   canWrite: boolean
   canDelete: boolean
   onAssign: () => void
   onReturn: () => void
   onDelete: () => void
}) {
   return (
      <tr className="transition-colors hover:bg-surface-muted/50 dark:hover:bg-navy-900/30">
         <td className="px-5 py-4">
            <div className="min-w-0">
               <Link href={`/admin/assets/${asset.id}`} className="font-extrabold text-navy-950 hover:text-brand-700 dark:text-white dark:hover:text-brand-200">
                  {asset.name}
               </Link>
               <p dir="ltr" className="mt-0.5 font-mono text-[11px] text-brand-700 dark:text-brand-200">
                  {asset.assetCode}
               </p>
            </div>
         </td>
         <td className="px-4 py-4">
            <p className="text-xs font-bold text-navy-700 dark:text-navy-200">{fa.assets.types[asset.type] ?? asset.type}</p>
            <p className="mt-0.5 text-[11px] text-navy-500 dark:text-navy-400">{fa.assets.categories[asset.category] ?? asset.category}</p>
         </td>
         <td className="px-4 py-4 text-xs">
            {asset.currentAssignment ? (
               <Link href={`/admin/employees/${asset.currentAssignment.employee.id}`} className="font-bold text-navy-800 hover:text-brand-700 dark:text-navy-100 dark:hover:text-brand-200">
                  {asset.currentAssignment.employee.firstName} {asset.currentAssignment.employee.lastName}
               </Link>
            ) : (
               <span className="rounded-full bg-surface-muted px-2 py-1 text-[10px] font-bold text-navy-500 dark:bg-navy-800 dark:text-navy-400">
                  {fa.assets.unassignedBadge}
               </span>
            )}
         </td>
         <td className="px-4 py-4 text-xs text-navy-600 dark:text-navy-300">
            {asset.location ? `${asset.location.floor} / ${asset.location.roomNumber}` : "—"}
         </td>
         <td className="px-4 py-4">
            <StatusBadge tone={assetTone(asset.status)} label={fa.assets.statuses[asset.status] ?? asset.status} />
         </td>
         <td dir="ltr" className="px-4 py-4 font-mono text-[11px] text-navy-600 dark:text-navy-300">
            {asset.serialNumber ?? "—"}
         </td>
         <td className="px-5 py-4">
            <div className="flex items-center justify-end gap-1.5">
               {canWrite ? (
                  <Link
                     href={`/admin/assets/${asset.id}/edit`}
                     aria-label={fa.assets.detail.editAction}
                     title={fa.assets.detail.editAction}
                     className="rounded-full border border-border-subtle p-2 text-navy-600 transition-colors hover:border-brand-400 hover:text-brand-700 dark:border-navy-700 dark:text-navy-300"
                  >
                     <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                  </Link>
               ) : null}
               {canWrite ? (
                  <RowAction label={fa.assets.detail.assignAction} onClick={onAssign} tone="brand">
                     <UserPlusIcon className="h-4 w-4" aria-hidden="true" />
                  </RowAction>
               ) : null}
               {canWrite && asset.currentAssignment ? (
                  <RowAction label={fa.assets.detail.returnAction} onClick={onReturn} tone="accent">
                     <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" />
                  </RowAction>
               ) : null}
               {canDelete ? (
                  <RowAction label={fa.assets.detail.deleteAction} onClick={onDelete} tone="danger">
                     <TrashIcon className="h-4 w-4" aria-hidden="true" />
                  </RowAction>
               ) : null}
            </div>
         </td>
      </tr>
   )
}

function AssetCard({
   asset,
   canWrite,
   canDelete,
   onAssign,
   onReturn,
   onDelete,
}: {
   asset: AssetSummaryDto
   canWrite: boolean
   canDelete: boolean
   onAssign: () => void
   onReturn: () => void
   onDelete: () => void
}) {
   return (
      <article className="rounded-3xl border border-border-subtle bg-surface p-4 shadow-lg shadow-navy-900/5 dark:shadow-black/20">
         <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
               <Link href={`/admin/assets/${asset.id}`} className="truncate font-extrabold text-navy-950 hover:text-brand-700 dark:text-white dark:hover:text-brand-200">
                  {asset.name}
               </Link>
               <p dir="ltr" className="mt-0.5 font-mono text-[11px] text-brand-700 dark:text-brand-200">{asset.assetCode}</p>
            </div>
            <StatusBadge tone={assetTone(asset.status)} label={fa.assets.statuses[asset.status] ?? asset.status} />
         </div>

         <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div>
               <dt className="text-navy-500 dark:text-navy-400">{fa.assets.columns.type}</dt>
               <dd className="mt-0.5 font-bold text-navy-800 dark:text-navy-100">{fa.assets.types[asset.type] ?? asset.type}</dd>
            </div>
            <div>
               <dt className="text-navy-500 dark:text-navy-400">{fa.assets.columns.assignee}</dt>
               <dd className="mt-0.5 truncate font-bold text-navy-800 dark:text-navy-100">
                  {asset.currentAssignment
                     ? `${asset.currentAssignment.employee.firstName} ${asset.currentAssignment.employee.lastName}`
                     : fa.assets.unassignedBadge}
               </dd>
            </div>
            <div>
               <dt className="text-navy-500 dark:text-navy-400">{fa.assets.columns.location}</dt>
               <dd className="mt-0.5 font-bold text-navy-800 dark:text-navy-100">
                  {asset.location ? `${asset.location.floor} / ${asset.location.roomNumber}` : "—"}
               </dd>
            </div>
            <div>
               <dt className="text-navy-500 dark:text-navy-400">{fa.assets.columns.serial}</dt>
               <dd dir="ltr" className="mt-0.5 truncate font-mono text-[11px] font-bold text-navy-800 dark:text-navy-100">{asset.serialNumber ?? "—"}</dd>
            </div>
         </dl>

         <div className="mt-4 flex flex-wrap gap-2 border-t border-border-subtle pt-3">
            <Link href={`/admin/assets/${asset.id}`} className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-bold text-navy-700 dark:border-navy-700 dark:text-navy-200">
               {fa.assets.pageTitle}
            </Link>
            {canWrite ? (
               <Link href={`/admin/assets/${asset.id}/edit`} className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-bold text-navy-700 dark:border-navy-700 dark:text-navy-200">
                  {fa.common.edit}
               </Link>
            ) : null}
            {canWrite ? (
               <button type="button" onClick={onAssign} className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-bold text-navy-700 dark:border-navy-700 dark:text-navy-200">
                  {fa.assets.detail.assignAction}
               </button>
            ) : null}
            {canWrite && asset.currentAssignment ? (
               <button type="button" onClick={onReturn} className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-bold text-navy-700 dark:border-navy-700 dark:text-navy-200">
                  {fa.assets.detail.returnAction}
               </button>
            ) : null}
            {canDelete ? (
               <button type="button" onClick={onDelete} className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-bold text-red-700 dark:border-red-500/40 dark:text-red-200">
                  {fa.common.delete}
               </button>
            ) : null}
         </div>
      </article>
   )
}

function RowAction({
   children,
   label,
   onClick,
   tone = "neutral",
}: {
   children: ReactNode
   label: string
   onClick: () => void
   tone?: "neutral" | "brand" | "accent" | "danger"
}) {
   const tones = {
      neutral: "border-border-subtle text-navy-600 hover:border-brand-400 hover:text-brand-700 dark:border-navy-700 dark:text-navy-300",
      brand: "border-brand-300 text-brand-700 hover:bg-brand-50 dark:border-brand-500/40 dark:text-brand-200 dark:hover:bg-brand-500/10",
      accent: "border-accent-300 text-accent-800 hover:bg-accent-50 dark:border-accent-500/40 dark:text-accent-100 dark:hover:bg-accent-500/10",
      danger: "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-200 dark:hover:bg-red-500/10",
   }
   return (
      <button
         type="button"
         onClick={onClick}
         aria-label={label}
         title={label}
         className={`rounded-full border p-2 transition-colors ${tones[tone]}`}
      >
         {children}
      </button>
   )
}

function assetActionError(err: unknown, action: "assign" | "return" | "delete"): string {
   if (err instanceof ApiError) {
      if (err.code === "already_assigned") return fa.assets.assign.alreadyAssigned
      if (err.code === "not_assigned") return fa.assets.assign.notAssigned
      if (err.code === "asset_unavailable" || err.code === "asset_assigned") {
         return action === "delete" ? fa.assets.detail.deleteBlocked : fa.assets.assign.cannotAssignUnavailable
      }
      if (err.errors && Object.keys(err.errors).length > 0) {
         return Object.values(err.errors)[0] ?? fa.admin.genericError
      }
   }
   return fa.admin.genericError
}
