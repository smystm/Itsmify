"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowPathIcon, ExclamationTriangleIcon, InboxIcon, MagnifyingGlassIcon, TicketIcon, UserPlusIcon } from "@heroicons/react/24/outline"
import PageHero from "@/app/components/ui/PageHero"
import StatStrip from "@/app/components/ui/StatStrip"
import AdminNotice, { SkeletonBlock } from "@/app/components/ui/AdminNotice"
import EmptyState from "@/app/components/ui/EmptyState"
import FilterSelect from "@/app/components/ui/FilterSelect"
import Pagination from "@/app/components/ui/Pagination"
import TicketList from "./TicketList"
import { getJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import type {
   TicketAssigneeOptionDto,
   TicketCategoryRefDto,
   TicketListResponse,
} from "@/lib/tickets/types"

interface AdminTicketsViewProps {
   categories: TicketCategoryRefDto[]
   assignees: TicketAssigneeOptionDto[]
}

function actorOptionLabel(actor: TicketAssigneeOptionDto): string {
   const name = `${actor.firstName} ${actor.lastName}`.trim() || actor.username
   return `${name} (${fa.roles[actor.role] ?? actor.role})`
}

export default function AdminTicketsView({ categories, assignees }: AdminTicketsViewProps) {
   const [data, setData] = useState<TicketListResponse | null>(null)
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
   const [refreshKey, setRefreshKey] = useState(0)

   const [query, setQuery] = useState("")
   const [debouncedQuery, setDebouncedQuery] = useState("")
   const [status, setStatus] = useState("")
   const [priority, setPriority] = useState("")
   const [type, setType] = useState("")
   const [categoryId, setCategoryId] = useState("")
   const [assignee, setAssignee] = useState("")
   const [page, setPage] = useState(1)

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
      if (status) params.set("status", status)
      if (priority) params.set("priority", priority)
      if (type) params.set("type", type)
      if (categoryId) params.set("categoryId", categoryId)
      if (assignee === "unassigned" || assignee === "mine") params.set("assigned", assignee)
      else if (assignee) params.set("assigneeId", assignee)
      params.set("page", String(page))
      params.set("pageSize", "20")

      void getJson<TicketListResponse>(`/api/admin/tickets?${params.toString()}`, controller.signal)
         .then((result) => {
            setData(result)
            if (result.totalPages > 0 && page > result.totalPages) setPage(result.totalPages)
         })
         .catch((err) => {
            if (controller.signal.aborted) return
            console.error("admin ticket list load failed", err)
            setError(fa.tickets.list.loadError)
         })
         .finally(() => {
            if (!controller.signal.aborted) setLoading(false)
         })

      return () => controller.abort()
   }, [debouncedQuery, status, priority, type, categoryId, assignee, page, refreshKey])

   const statusOptions = useMemo(
      () => [
         { value: "", label: fa.tickets.allStatuses },
         ...Object.entries(fa.tickets.statuses).map(([value, label]) => ({ value, label })),
      ],
      [],
   )
   const priorityOptions = useMemo(
      () => [
         { value: "", label: fa.tickets.allPriorities },
         ...Object.entries(fa.tickets.priorities).map(([value, label]) => ({ value, label })),
      ],
      [],
   )
   const typeOptions = useMemo(
      () => [
         { value: "", label: fa.tickets.allTypes },
         ...Object.entries(fa.tickets.types).map(([value, label]) => ({ value, label })),
      ],
      [],
   )
   const categoryOptions = useMemo(
      () => [
         { value: "", label: fa.tickets.allCategories },
         ...categories.map((category) => ({ value: category.id, label: category.name })),
      ],
      [categories],
   )
   const assigneeOptions = useMemo(
      () => [
         { value: "", label: fa.tickets.allAssignees },
         { value: "unassigned", label: fa.tickets.unassignedFilter },
         { value: "mine", label: fa.tickets.mineFilter },
         ...assignees.map((actor) => ({ value: actor.id, label: actorOptionLabel(actor) })),
      ],
      [assignees],
   )

   const hasFilters = Boolean(debouncedQuery || status || priority || type || categoryId || assignee)
   const totalLabel = fa.tickets.list.totalCount.replace("{count}", (data?.total ?? 0).toLocaleString("fa-IR"))
   const refresh = () => setRefreshKey((current) => current + 1)

   return (
      <div className="space-y-6">
         <PageHero
            badge={fa.tickets.adminList.badge}
            title={fa.tickets.adminList.title}
            description={fa.tickets.adminList.description}
            tone="admin"
         />

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

         {loading && !data ? (
            <div className="space-y-4">
               <SkeletonBlock className="h-28" />
               <SkeletonBlock className="h-20" />
               <SkeletonBlock className="h-20" />
            </div>
         ) : null}

         {data ? (
            <StatStrip
               columns={4}
               items={[
                  {
                     value: data.stats.total.toLocaleString("fa-IR"),
                     label: fa.tickets.adminList.stats.total,
                     icon: <TicketIcon className="h-5 w-5" />,
                  },
                  {
                     value: data.stats.unassigned.toLocaleString("fa-IR"),
                     label: fa.tickets.adminList.stats.unassigned,
                     icon: <InboxIcon className="h-5 w-5" />,
                  },
                  {
                     value: data.stats.mine.toLocaleString("fa-IR"),
                     label: fa.tickets.adminList.stats.mine,
                     icon: <UserPlusIcon className="h-5 w-5" />,
                  },
                  {
                     value: data.stats.critical.toLocaleString("fa-IR"),
                     label: fa.tickets.adminList.stats.critical,
                     icon: <ExclamationTriangleIcon className="h-5 w-5" />,
                  },
               ]}
            />
         ) : null}

         <section className="animate-fade-in-up relative z-10 rounded-3xl border border-border-subtle bg-surface p-4 shadow-lg shadow-navy-900/5 dark:shadow-black/20 sm:p-5">
            <div className="flex flex-wrap items-end gap-3">
               <div className="relative min-w-[15rem] flex-1">
                  <label htmlFor="admin-ticket-search" className="mb-1 block text-[11px] font-bold text-navy-500 dark:text-navy-400">
                     {fa.common.search}
                  </label>
                  <div className="relative">
                     <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 inset-s-3 flex w-6 items-center justify-center text-navy-500">
                        <MagnifyingGlassIcon className="h-5 w-5" />
                     </span>
                     <input
                        id="admin-ticket-search"
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={fa.tickets.list.searchPlaceholder}
                        className="w-full rounded-full border border-border-subtle bg-surface px-4 py-2.5 ps-10 pe-11 text-sm font-medium text-navy-800 outline-none transition-colors focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-50"
                     />
                  </div>
               </div>

               <FilterSelect
                  label={fa.tickets.list.columns.status}
                  value={status}
                  onChange={(value) => {
                     setStatus(value)
                     setPage(1)
                  }}
                  options={statusOptions}
               />
               <FilterSelect
                  label={fa.tickets.list.columns.priority}
                  value={priority}
                  onChange={(value) => {
                     setPriority(value)
                     setPage(1)
                  }}
                  options={priorityOptions}
               />
               <FilterSelect
                  label={fa.tickets.list.columns.type}
                  value={type}
                  onChange={(value) => {
                     setType(value)
                     setPage(1)
                  }}
                  options={typeOptions}
               />
               <FilterSelect
                  label={fa.tickets.list.columns.category}
                  value={categoryId}
                  onChange={(value) => {
                     setCategoryId(value)
                     setPage(1)
                  }}
                  options={categoryOptions}
               />
               <FilterSelect
                  label={fa.tickets.list.columns.assignee}
                  value={assignee}
                  onChange={(value) => {
                     setAssignee(value)
                     setPage(1)
                  }}
                  options={assigneeOptions}
               />

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
                     ? fa.tickets.list.loading
                     : fa.employees.pageOf
                          .replace("{page}", String(data?.page ?? page))
                          .replace("{pages}", String(data?.totalPages ?? 0))}
               </span>
            </div>
         </section>

         {!loading && data && data.tickets.length === 0 ? (
            <EmptyState
               icon={<InboxIcon className="h-6 w-6" />}
               title={hasFilters ? fa.tickets.list.searchEmptyTitle : fa.tickets.adminList.emptyTitle}
               body={hasFilters ? fa.tickets.list.searchEmptyBody : fa.tickets.adminList.emptyBody}
               tone="accent"
            />
         ) : null}

         {data && data.tickets.length > 0 ? (
            <>
               <TicketList tickets={data.tickets} basePath="/admin/tickets" admin />
               <Pagination page={data.page} totalPages={data.totalPages} onPage={(next) => setPage(next)} disabled={loading} />
            </>
         ) : null}
      </div>
   )
}
