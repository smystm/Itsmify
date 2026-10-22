"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
   ArrowPathIcon,
   CheckCircleIcon,
   ComputerDesktopIcon,
   NoSymbolIcon,
   PlusIcon,
   UserPlusIcon,
   UsersIcon,
   WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline"
import PageHero from "@/app/components/ui/PageHero"
import StatStrip from "@/app/components/ui/StatStrip"
import AdminNotice, { SkeletonBlock } from "@/app/components/ui/AdminNotice"
import StatusBadge from "@/app/components/ui/StatusBadge"
import EmptyState from "@/app/components/ui/EmptyState"
import { getJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import type { AdminEmployeeDto } from "@/lib/employees/types"
import type { AssetStatsDto, AssetSummaryDto } from "@/lib/assets/types"

interface OverviewResponse {
   permissions: { employees: boolean; assets: boolean; writeAssets: boolean }
   employees: {
      stats: { total: number; active: number; suspended: number; newThisMonth: number }
      recent: AdminEmployeeDto[]
   } | null
   assets: { stats: AssetStatsDto; recent: AssetSummaryDto[] } | null
}

export default function AdminOverview() {
   const [data, setData] = useState<OverviewResponse | null>(null)
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
   const [refreshKey, setRefreshKey] = useState(0)

   useEffect(() => {
      const controller = new AbortController()
      void getJson<OverviewResponse>("/api/admin/overview", controller.signal)
         .then((result) => setData(result))
         .catch((err) => {
            if (controller.signal.aborted) return
            console.error("overview load failed", err)
            setError(fa.dashboard.loadError)
         })
         .finally(() => {
            if (!controller.signal.aborted) setLoading(false)
         })
      return () => controller.abort()
   }, [refreshKey])

   const refresh = () => {
      setLoading(true)
      setError(null)
      setRefreshKey((current) => current + 1)
   }

   return (
      <div className="space-y-6">
         <PageHero
            badge={fa.admin.workspaceLabel}
            title={fa.dashboard.title}
            description={fa.dashboard.description}
            tone="admin"
            actions={
               <div className="flex flex-wrap gap-2">
                  {data?.permissions.employees ? (
                     <Link
                        href="/admin/employees/new"
                        className="inline-flex items-center gap-2 rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all hover:brightness-110"
                     >
                        <UserPlusIcon className="h-4 w-4" aria-hidden="true" />
                        {fa.dashboard.newEmployee}
                     </Link>
                  ) : null}
                  {data?.permissions.assets && data.permissions.writeAssets ? (
                     <Link
                        href="/admin/assets/new"
                        className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-2.5 text-sm font-bold text-navy-700 transition-colors hover:border-brand-400 hover:text-brand-800 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200"
                     >
                        <PlusIcon className="h-4 w-4" aria-hidden="true" />
                        {fa.dashboard.newAsset}
                     </Link>
                  ) : null}
               </div>
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

         {loading && !data ? (
            <div className="space-y-4">
               <SkeletonBlock className="h-28" />
               <div className="grid gap-4 lg:grid-cols-2">
                  <SkeletonBlock className="h-72" />
                  <SkeletonBlock className="h-72" />
               </div>
            </div>
         ) : null}

         {data ? (
            <>
               {data.permissions.employees && data.employees ? (
                  <section className="space-y-4">
                     <SectionHeading
                        title={fa.dashboard.employeesTitle}
                        description={fa.dashboard.employeesDescription}
                        href="/admin/employees"
                        linkLabel={fa.dashboard.manageEmployees}
                        onRefresh={refresh}
                     />

                     <StatStrip
                        columns={4}
                        items={[
                           {
                              value: data.employees.stats.total.toLocaleString("fa-IR"),
                              label: fa.dashboard.totalEmployees,
                              icon: <UsersIcon className="h-5 w-5" />,
                           },
                           {
                              value: data.employees.stats.active.toLocaleString("fa-IR"),
                              label: fa.dashboard.activeEmployees,
                              icon: <CheckCircleIcon className="h-5 w-5" />,
                           },
                           {
                              value: data.employees.stats.suspended.toLocaleString("fa-IR"),
                              label: fa.dashboard.suspendedEmployees,
                              icon: <NoSymbolIcon className="h-5 w-5" />,
                           },
                           {
                              value: data.employees.stats.newThisMonth.toLocaleString("fa-IR"),
                              label: fa.dashboard.newThisMonth,
                              icon: <UserPlusIcon className="h-5 w-5" />,
                           },
                        ]}
                     />

                     <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-3xl border border-border-subtle bg-surface p-5 shadow-xl shadow-navy-900/5 dark:shadow-black/20 lg:col-span-2">
                           <h3 className="text-sm font-extrabold text-navy-950 dark:text-white">{fa.dashboard.recentEmployees}</h3>
                           {data.employees.recent.length === 0 ? (
                              <div className="mt-4">
                                 <EmptyState
                                    icon={<UsersIcon className="h-6 w-6" />}
                                    title={fa.dashboard.noRecentEmployees}
                                    body={fa.employees.emptyBody}
                                    action={{ label: fa.dashboard.newEmployee, href: "/admin/employees/new" }}
                                    tone="brand"
                                 />
                              </div>
                           ) : (
                              <ul className="mt-4 divide-y divide-border-subtle">
                                 {data.employees.recent.map((employee) => (
                                    <li key={employee.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                       <div className="min-w-0">
                                          <Link
                                             href={`/admin/employees/${employee.id}`}
                                             className="text-sm font-extrabold text-navy-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-200"
                                          >
                                             {employee.firstName} {employee.lastName}
                                          </Link>
                                          <p dir="ltr" className="mt-0.5 text-xs text-navy-500 dark:text-navy-400">
                                             {employee.username}
                                             {employee.profile?.orgUnit ? ` · ${employee.profile.orgUnit.name}` : ""}
                                          </p>
                                       </div>
                                       <div className="flex items-center gap-2">
                                          <span className="text-[11px] text-navy-500 dark:text-navy-400">
                                             {fa.roles[employee.role] ?? employee.role}
                                          </span>
                                          <StatusBadge
                                             tone={employee.status === "ACTIVE" ? "approved" : "rejected"}
                                             label={fa.employees.statuses[employee.status] ?? employee.status}
                                          />
                                       </div>
                                    </li>
                                 ))}
                              </ul>
                           )}
                        </div>

                        <div className="rounded-3xl border border-border-subtle bg-surface p-5 shadow-xl shadow-navy-900/5 dark:shadow-black/20">
                           <h3 className="text-sm font-extrabold text-navy-950 dark:text-white">{fa.dashboard.quickActions}</h3>
                           <div className="mt-4 space-y-3">
                              <Link
                                 href="/admin/employees"
                                 className="block rounded-2xl border border-border-subtle px-4 py-3 transition-colors hover:border-brand-400 dark:border-navy-700"
                              >
                                 <p className="text-sm font-bold text-navy-900 dark:text-white">{fa.dashboard.manageEmployees}</p>
                                 <p className="mt-1 text-xs leading-5 text-navy-500 dark:text-navy-400">{fa.dashboard.manageEmployeesBody}</p>
                              </Link>
                              <Link
                                 href="/admin/employees/new"
                                 className="block rounded-2xl border border-border-subtle px-4 py-3 transition-colors hover:border-brand-400 dark:border-navy-700"
                              >
                                 <p className="text-sm font-bold text-navy-900 dark:text-white">{fa.dashboard.newEmployee}</p>
                                 <p className="mt-1 text-xs leading-5 text-navy-500 dark:text-navy-400">{fa.employees.form.createDescription}</p>
                              </Link>
                           </div>
                        </div>
                     </div>
                  </section>
               ) : null}

               {data.permissions.assets && data.assets ? (
                  <section className="space-y-4">
                     <SectionHeading
                        title={fa.dashboard.assetsTitle}
                        description={fa.dashboard.assetsDescription}
                        href="/admin/assets"
                        linkLabel={fa.dashboard.manageAssets}
                        onRefresh={refresh}
                     />

                     <StatStrip
                        columns={4}
                        items={[
                           {
                              value: data.assets.stats.total.toLocaleString("fa-IR"),
                              label: fa.dashboard.totalAssets,
                              icon: <ComputerDesktopIcon className="h-5 w-5" />,
                           },
                           {
                              value: data.assets.stats.assigned.toLocaleString("fa-IR"),
                              label: fa.dashboard.assignedAssets,
                              icon: <CheckCircleIcon className="h-5 w-5" />,
                           },
                           {
                              value: data.assets.stats.unassigned.toLocaleString("fa-IR"),
                              label: fa.dashboard.unassignedAssets,
                              icon: <UsersIcon className="h-5 w-5" />,
                           },
                           {
                              value: data.assets.stats.inRepair.toLocaleString("fa-IR"),
                              label: fa.dashboard.inRepairAssets,
                              icon: <WrenchScrewdriverIcon className="h-5 w-5" />,
                           },
                        ]}
                     />

                     <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-3xl border border-border-subtle bg-surface p-5 shadow-xl shadow-navy-900/5 dark:shadow-black/20">
                           <h3 className="text-sm font-extrabold text-navy-950 dark:text-white">{fa.dashboard.byCategory}</h3>
                           <div className="mt-4 space-y-3">
                              {data.assets.stats.byCategory.length === 0 ? (
                                 <p className="text-xs text-navy-500 dark:text-navy-400">{fa.dashboard.noRecentAssets}</p>
                              ) : (
                                 data.assets.stats.byCategory.map((row) => (
                                    <DistributionRow
                                       key={row.category}
                                       label={fa.assets.categories[row.category] ?? row.category}
                                       count={row.count}
                                       max={Math.max(...data.assets!.stats.byCategory.map((item) => item.count), 1)}
                                       tone="brand"
                                    />
                                 ))
                              )}
                           </div>
                           <h3 className="mt-6 text-sm font-extrabold text-navy-950 dark:text-white">{fa.dashboard.byStatus}</h3>
                           <div className="mt-4 space-y-3">
                              {data.assets.stats.byStatus.map((row) => (
                                 <DistributionRow
                                    key={row.status}
                                    label={fa.assets.statuses[row.status] ?? row.status}
                                    count={row.count}
                                    max={Math.max(...data.assets!.stats.byStatus.map((item) => item.count), 1)}
                                    tone={row.status === "ACTIVE" ? "brand" : row.status === "IN_REPAIR" ? "accent" : "muted"}
                                 />
                              ))}
                           </div>
                        </div>

                        <div className="rounded-3xl border border-border-subtle bg-surface p-5 shadow-xl shadow-navy-900/5 dark:shadow-black/20 lg:col-span-2">
                           <h3 className="text-sm font-extrabold text-navy-950 dark:text-white">{fa.dashboard.recentAssets}</h3>
                           {data.assets.recent.length === 0 ? (
                              <div className="mt-4">
                                 <EmptyState
                                    icon={<ComputerDesktopIcon className="h-6 w-6" />}
                                    title={fa.dashboard.noRecentAssets}
                                    body={fa.assets.emptyBody}
                                    action={
                                       data.permissions.writeAssets
                                          ? { label: fa.dashboard.newAsset, href: "/admin/assets/new" }
                                          : undefined
                                    }
                                    tone="accent"
                                 />
                              </div>
                           ) : (
                              <ul className="mt-4 divide-y divide-border-subtle">
                                 {data.assets.recent.map((asset) => (
                                    <li key={asset.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                       <div className="min-w-0">
                                          <Link
                                             href={`/admin/assets/${asset.id}`}
                                             className="text-sm font-extrabold text-navy-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-200"
                                          >
                                             {asset.name}
                                          </Link>
                                          <p dir="ltr" className="mt-0.5 font-mono text-[11px] text-brand-700 dark:text-brand-200">
                                             {asset.assetCode}
                                             {asset.currentAssignment
                                                ? ` · ${asset.currentAssignment.employee.firstName} ${asset.currentAssignment.employee.lastName}`
                                                : ` · ${fa.assets.unassignedBadge}`}
                                          </p>
                                       </div>
                                       <StatusBadge
                                          tone={
                                             asset.status === "ACTIVE"
                                                ? "approved"
                                                : asset.status === "IN_REPAIR"
                                                  ? "pending"
                                                  : asset.status === "LOST"
                                                    ? "rejected"
                                                    : "neutral"
                                          }
                                          label={fa.assets.statuses[asset.status] ?? asset.status}
                                       />
                                    </li>
                                 ))}
                              </ul>
                           )}
                        </div>
                     </div>
                  </section>
               ) : null}

               {!data.permissions.employees && !data.permissions.assets ? (
                  <AdminNotice tone="info">{fa.dashboard.noAccessBody}</AdminNotice>
               ) : null}
            </>
         ) : null}
      </div>
   )
}

function SectionHeading({
   title,
   description,
   href,
   linkLabel,
   onRefresh,
}: {
   title: string
   description: string
   href: string
   linkLabel: string
   onRefresh: () => void
}) {
   return (
      <div className="flex flex-wrap items-end justify-between gap-3">
         <div>
            <h2 className="text-lg font-extrabold text-navy-950 dark:text-white">{title}</h2>
            <p className="mt-1 text-xs leading-6 text-navy-500 dark:text-navy-400">{description}</p>
         </div>
         <div className="flex items-center gap-2">
            <Link
               href={href}
               className="rounded-full border border-border-subtle bg-surface px-4 py-2 text-xs font-bold text-navy-700 transition-colors hover:border-brand-400 hover:text-brand-800 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200"
            >
               {linkLabel}
            </Link>
            <button
               type="button"
               onClick={onRefresh}
               aria-label={fa.common.retry}
               className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-surface text-navy-600 transition-colors hover:border-brand-400 hover:text-brand-700 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-300"
            >
               <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            </button>
         </div>
      </div>
   )
}

function DistributionRow({
   label,
   count,
   max,
   tone,
}: {
   label: string
   count: number
   max: number
   tone: "brand" | "accent" | "muted"
}) {
   const width = Math.max(4, Math.round((count / Math.max(max, 1)) * 100))
   const bar = tone === "brand" ? "bg-brand-500" : tone === "accent" ? "bg-accent-500" : "bg-navy-300 dark:bg-navy-600"
   return (
      <div>
         <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="font-bold text-navy-700 dark:text-navy-200">{label}</span>
            <span className="text-navy-500 dark:text-navy-400">{count.toLocaleString("fa-IR")}</span>
         </div>
         <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted dark:bg-navy-800">
            <div className={`h-full rounded-full ${bar}`} style={{ width: `${width}%` }} />
         </div>
      </div>
   )
}
