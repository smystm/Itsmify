"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowPathIcon, MagnifyingGlassIcon, PlusIcon, TicketIcon } from "@heroicons/react/24/outline"
import PageHero from "@/app/components/ui/PageHero"
import AdminNotice, { SkeletonBlock } from "@/app/components/ui/AdminNotice"
import EmptyState from "@/app/components/ui/EmptyState"
import FilterSelect from "@/app/components/ui/FilterSelect"
import Pagination from "@/app/components/ui/Pagination"
import TicketList from "./TicketList"
import { getJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import type { TicketCategoryRefDto, TicketListResponse } from "@/lib/tickets/types"

interface PanelTicketsViewProps {
   categories: TicketCategoryRefDto[]
}

export default function PanelTicketsView({ categories }: PanelTicketsViewProps) {
   const [data, setData] = useState<TicketListResponse | null>(null)
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
   const [refreshKey, setRefreshKey] = useState(0)

   const [query, setQuery] = useState("")
   const [debouncedQuery, setDebouncedQuery] = useState("")
   const [status, setStatus] = useState("")
   const [priority, setPriority] = useState("")
   const [categoryId, setCategoryId] = useState("")
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
      if (categoryId) params.set("categoryId", categoryId)
      params.set("page", String(page))
      params.set("pageSize", "20")

      void getJson<TicketListResponse>(`/api/panel/tickets?${params.toString()}`, controller.signal)
         .then((result) => {
            setData(result)
            if (result.totalPages > 0 && page > result.totalPages) setPage(result.totalPages)
         })
         .catch((err) => {
            if (controller.signal.aborted) return
            console.error("ticket list load failed", err)
            setError(fa.tickets.list.loadError)
         })
         .finally(() => {
            if (!controller.signal.aborted) setLoading(false)
         })

      return () => controller.abort()
   }, [debouncedQuery, status, priority, categoryId, page, refreshKey])

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
   const categoryOptions = useMemo(
      () => [
         { value: "", label: fa.tickets.allCategories },
         ...categories.map((category) => ({ value: category.id, label: category.name })),
      ],
      [categories],
   )

   const hasFilters = Boolean(debouncedQuery || status || priority || categoryId)
   const totalLabel = fa.tickets.list.totalCount.replace("{count}", (data?.total ?? 0).toLocaleString("fa-IR"))
   const refresh = () => setRefreshKey((current) => current + 1)

   return (
      <div className="space-y-6">
         <PageHero
            badge={fa.tickets.list.badge}
            title={fa.tickets.list.title}
            description={fa.tickets.list.description}
            actions={
               <Link
                  href="/panel/tickets/new"
                  className="inline-flex items-center gap-2 rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all duration-300 hover:brightness-110"
               >
                  <PlusIcon className="h-5 w-5" aria-hidden="true" />
                  {fa.tickets.list.newTicket}
               </Link>
            }
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

         <section className="animate-fade-in-up relative z-10 rounded-3xl border border-border-subtle bg-surface p-4 shadow-lg shadow-navy-900/5 dark:shadow-black/20 sm:p-5">
            <div className="flex flex-wrap items-end gap-3">
               <div className="relative min-w-[15rem] flex-1">
                  <label htmlFor="ticket-search" className="mb-1 block text-[11px] font-bold text-navy-500 dark:text-navy-400">
                     {fa.common.search}
                  </label>
                  <div className="relative">
                     <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 inset-s-3 flex w-6 items-center justify-center text-navy-500">
                        <MagnifyingGlassIcon className="h-5 w-5" />
                     </span>
                     <input
                        id="ticket-search"
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
                  label={fa.tickets.list.columns.category}
                  value={categoryId}
                  onChange={(value) => {
                     setCategoryId(value)
                     setPage(1)
                  }}
                  options={categoryOptions}
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

         {loading && !data ? (
            <div className="space-y-3">
               <SkeletonBlock className="h-20" />
               <SkeletonBlock className="h-20" />
               <SkeletonBlock className="h-20" />
               <SkeletonBlock className="h-20" />
            </div>
         ) : null}

         {!loading && data && data.tickets.length === 0 ? (
            <EmptyState
               icon={<TicketIcon className="h-6 w-6" />}
               title={hasFilters ? fa.tickets.list.searchEmptyTitle : fa.tickets.list.emptyTitle}
               body={hasFilters ? fa.tickets.list.searchEmptyBody : fa.tickets.list.emptyBody}
               action={{ label: fa.tickets.list.newTicket, href: "/panel/tickets/new" }}
               tone="brand"
            />
         ) : null}

         {data && data.tickets.length > 0 ? (
            <>
               <TicketList tickets={data.tickets} basePath="/panel/tickets" />
               <Pagination page={data.page} totalPages={data.totalPages} onPage={(next) => setPage(next)} disabled={loading} />
            </>
         ) : null}
      </div>
   )
}
