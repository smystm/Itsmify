"use client"

import { useEffect, useState } from "react"
import { UserPlusIcon, UsersIcon, ShieldCheckIcon, NoSymbolIcon } from "@heroicons/react/24/outline"
import PageHero from "@/app/components/ui/PageHero"
import StatStrip from "@/app/components/ui/StatStrip"
import QuickActionTile from "@/app/components/ui/QuickActionTile"
import AdminNotice, { SkeletonBlock } from "@/app/components/ui/AdminNotice"
import StatusBadge from "@/app/components/ui/StatusBadge"
import { getJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import type { AdminUser } from "./types"

/**
 * The SYS_ADMIN home: one snapshot pulled from the same guarded endpoint the
 * user-management page uses, so "what the overview claims" and "what the list
 * shows" cannot drift apart.
 */
export default function AdminOverview() {
   const [users, setUsers] = useState<AdminUser[] | null>(null)
   const [error, setError] = useState<string | null>(null)

   useEffect(() => {
      let cancelled = false

      void getJson<{ users: AdminUser[] }>("/api/admin/users")
         .then((data) => {
            if (cancelled) return
            setUsers(data.users)
            setError(null)
         })
         .catch((err) => {
            if (cancelled) return
            console.error("admin overview load failed", err)
            setError(fa.admin.overviewLoadError)
         })

      return () => {
         cancelled = true
      }
   }, [])

   const usersCount = users?.length ?? 0
   const activeCount = users?.filter((user) => user.status === "ACTIVE").length ?? 0
   const suspendedCount = users?.filter((user) => user.status === "SUSPENDED").length ?? 0
   const adminsCount = users?.filter((user) => user.role === "SYS_ADMIN" && user.status === "ACTIVE").length ?? 0
   const recent = users?.slice(0, 3) ?? []

   return (
      <div className="space-y-8">
         <PageHero
            badge={fa.admin.forAdminsOnly}
            title={fa.admin.overviewTitle}
            description={fa.admin.overviewDescription}
            tone="admin"
         />

         {error ? <AdminNotice tone="error">{error}</AdminNotice> : null}

         {!users && !error ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
               <SkeletonBlock className="h-28" />
               <SkeletonBlock className="h-28" />
               <SkeletonBlock className="h-28" />
               <SkeletonBlock className="h-28" />
            </div>
         ) : null}

         {users ? (
            <StatStrip
               columns={4}
               items={[
                  {
                     value: usersCount.toLocaleString("fa-IR"),
                     label: fa.admin.overviewStats.users,
                     icon: <UsersIcon className="h-5 w-5" />,
                  },
                  {
                     value: activeCount.toLocaleString("fa-IR"),
                     label: fa.admin.overviewStats.active,
                     icon: <ShieldCheckIcon className="h-5 w-5" />,
                  },
                  {
                     value: suspendedCount.toLocaleString("fa-IR"),
                     label: fa.admin.overviewStats.suspended,
                     icon: <NoSymbolIcon className="h-5 w-5" />,
                  },
                  {
                     value: adminsCount.toLocaleString("fa-IR"),
                     label: fa.admin.overviewStats.admins,
                     icon: <UsersIcon className="h-5 w-5" />,
                  },
               ]}
            />
         ) : null}

         <section aria-label={fa.admin.quickActionsLabel} className="animate-fade-in-up space-y-4">
            <h2 className="text-lg font-extrabold text-navy-950 dark:text-white">{fa.admin.quickActionsTitle}</h2>

            <div className="grid gap-4 sm:grid-cols-2">
               <QuickActionTile
                  tone="brand"
                  icon={<UserPlusIcon className="h-6 w-6" />}
                  title={fa.admin.quickCreateUser.title}
                  body={fa.admin.quickCreateUser.body}
                  cta={fa.admin.quickCreateUser.cta}
                  href="/admin/users"
               />

               <QuickActionTile
                  tone="accent"
                  icon={<UsersIcon className="h-6 w-6" />}
                  title={fa.admin.quickUsers.title}
                  body={fa.admin.quickUsers.body}
                  cta={fa.admin.quickUsers.cta}
                  href="/admin/users"
               />
            </div>
         </section>

         {users && recent.length > 0 ? (
            <section
               aria-label={fa.admin.recentUsersTitle}
               className="animate-fade-in-up rounded-3xl border border-border-subtle bg-surface p-6 shadow-xl shadow-navy-900/5 dark:shadow-black/20"
            >
               <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                     <h2 className="text-lg font-extrabold text-navy-950 dark:text-white">{fa.admin.recentUsersTitle}</h2>
                     <p className="mt-1 text-xs font-medium text-navy-500 dark:text-navy-400">
                        {fa.admin.recentUsersSubtitle}
                     </p>
                  </div>
                  <a
                     href="/admin/users"
                     className="text-sm font-bold text-brand-700 hover:text-brand-800 dark:text-brand-200 dark:hover:text-brand-100"
                  >
                     {fa.admin.recentSeeAll}
                  </a>
               </div>

               <ul role="list" className="divide-y divide-border-subtle">
                  {recent.map((user) => (
                     <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                           <p className="truncate text-sm font-extrabold text-navy-900 dark:text-white">
                              {user.firstName} {user.lastName}
                           </p>
                           <p dir="ltr" className="truncate text-xs text-navy-500 dark:text-navy-400">
                              {user.username} — {user.phone ?? fa.admin.phoneNotSet}
                           </p>
                        </div>
                        <div className="flex items-center gap-3">
                           <StatusBadge
                              tone={user.status === "ACTIVE" ? "approved" : "rejected"}
                              label={fa.admin.statuses[user.status] ?? user.status}
                           />
                           <p className="text-xs font-medium text-navy-500 dark:text-navy-400">
                              {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                           </p>
                        </div>
                     </li>
                  ))}
               </ul>
            </section>
         ) : null}

         {users && users.length === 0 ? (
            <section
               aria-label={fa.admin.recentUsersTitle}
               className="rounded-3xl border border-dashed border-navy-300 bg-surface p-8 text-center dark:border-navy-700"
            >
               <UsersIcon className="mx-auto h-10 w-10 text-navy-400" aria-hidden="true" />
               <p className="mt-3 text-sm font-bold text-navy-700 dark:text-navy-200">{fa.admin.recentEmptyTitle}</p>
               <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">{fa.admin.recentEmptyBody}</p>
            </section>
         ) : null}
      </div>
   )
}
