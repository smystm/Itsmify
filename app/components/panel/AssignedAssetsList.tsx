import Link from "next/link"
import { ComputerDesktopIcon } from "@heroicons/react/24/outline"
import EmptyState from "@/app/components/ui/EmptyState"
import StatusBadge from "@/app/components/ui/StatusBadge"
import { formatJalaliDate } from "@/lib/date/jalali"
import { fa } from "@/lib/i18n/fa"

interface AssignedAsset {
   assignmentId: string
   assignedAt: string
   note: string | null
   asset: {
      id: string
      assetCode: string
      name: string
      category: string
      type: string
      status: string
   }
}

interface AssignedAssetsListProps {
   assignments: AssignedAsset[]
   /** IT roles may open the admin detail page; employees only see read-only cards. */
   canOpenAdminDetail: boolean
}

/**
 * Currently assigned assets, shared by the profile tab and /panel/assets.
 * It renders no actions: ownership scoping happens in the server query.
 */
export default function AssignedAssetsList({ assignments, canOpenAdminDetail }: AssignedAssetsListProps) {
   if (assignments.length === 0) {
      return (
         <div className="mt-6">
            <EmptyState
               icon={<ComputerDesktopIcon className="h-6 w-6" />}
               title={fa.profile.assetsEmptyTitle}
               body={fa.profile.assetsEmptyBody}
               tone="accent"
            />
         </div>
      )
   }

   return (
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
         {assignments.map((assignment) => {
            const content = (
               <>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                     <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-navy-900 dark:text-white">
                           {assignment.asset.name}
                        </p>
                        <p dir="ltr" className="mt-0.5 font-mono text-[11px] text-brand-700 dark:text-brand-200">
                           {assignment.asset.assetCode}
                        </p>
                     </div>
                     <StatusBadge
                        tone={
                           assignment.asset.status === "ACTIVE"
                              ? "approved"
                              : assignment.asset.status === "IN_REPAIR"
                                ? "pending"
                                : assignment.asset.status === "LOST"
                                  ? "rejected"
                                  : "neutral"
                        }
                        label={fa.assets.statuses[assignment.asset.status] ?? assignment.asset.status}
                     />
                  </div>
                  <p className="mt-2 text-xs text-navy-600 dark:text-navy-300">
                     {fa.assets.categories[assignment.asset.category] ?? assignment.asset.category}
                     {" · "}
                     {fa.assets.types[assignment.asset.type] ?? assignment.asset.type}
                  </p>
                  <p className="mt-1 text-[11px] text-navy-500 dark:text-navy-400">
                     {fa.profile.assignedAt}: {formatJalaliDate(assignment.assignedAt)}
                  </p>
                  {assignment.note ? (
                     <p className="mt-2 rounded-xl bg-surface-muted/70 px-3 py-2 text-[11px] leading-6 text-navy-600 dark:bg-navy-800/60 dark:text-navy-300">
                        {assignment.note}
                     </p>
                  ) : null}
               </>
            )

            return (
               <li key={assignment.assignmentId}>
                  {canOpenAdminDetail ? (
                     <Link
                        href={`/admin/assets/${assignment.asset.id}`}
                        className="block h-full rounded-2xl border border-border-subtle p-4 transition-colors hover:border-brand-400 dark:border-navy-700"
                     >
                        {content}
                     </Link>
                  ) : (
                     <div className="h-full rounded-2xl border border-border-subtle p-4">{content}</div>
                  )}
               </li>
            )
         })}
      </ul>
   )
}
