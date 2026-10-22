"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
   ArrowRightIcon,
   ArrowUturnLeftIcon,
   CheckCircleIcon,
   ClockIcon,
   ComputerDesktopIcon,
   PencilSquareIcon,
   TrashIcon,
   UserPlusIcon,
   WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline"
import PageHero from "@/app/components/ui/PageHero"
import StatStrip from "@/app/components/ui/StatStrip"
import FormSection from "@/app/components/ui/FormSection"
import AdminNotice from "@/app/components/ui/AdminNotice"
import StatusBadge from "@/app/components/ui/StatusBadge"
import EmptyState from "@/app/components/ui/EmptyState"
import ConfirmDialog from "@/app/components/ui/ConfirmDialog"
import AssetAssignmentDialog from "./AssetAssignmentDialog"
import AssetReturnDialog from "./AssetReturnDialog"
import { ApiError, deleteJson } from "@/app/helpers/API"
import { formatJalaliDate as formatDate, formatJalaliDateTime as formatDateTime } from "@/lib/date/jalali"
import { fa } from "@/lib/i18n/fa"
import type { AssetDetailDto } from "@/lib/assets/types"

interface AssetDetailViewProps {
   asset: AssetDetailDto
   canWrite: boolean
   canDelete: boolean
}

export default function AssetDetailView({ asset, canWrite, canDelete }: AssetDetailViewProps) {
   const router = useRouter()
   const [notice, setNotice] = useState<string | null>(null)
   const [error, setError] = useState<string | null>(null)
   const [assigning, setAssigning] = useState(false)
   const [returning, setReturning] = useState(false)
   const [deleting, setDeleting] = useState(false)
   const [busy, setBusy] = useState(false)

   const current = asset.currentAssignment
   const currentName = current ? `${current.employee.firstName} ${current.employee.lastName}` : null

   const remove = async () => {
      setBusy(true)
      setError(null)
      try {
         await deleteJson(`/api/admin/assets/${asset.id}`)
         setDeleting(false)
         router.push("/admin/assets")
         router.refresh()
      } catch (err) {
         if (err instanceof ApiError && err.code === "asset_assigned") {
            setError(fa.assets.detail.deleteBlockedBody)
         } else {
            setError(fa.admin.genericError)
         }
      } finally {
         setBusy(false)
      }
   }

   return (
      <div className="space-y-6">
         <PageHero
            badge={fa.assets.categories[asset.category] ?? asset.category}
            title={asset.name}
            description={`${asset.assetCode}${asset.brand ? ` · ${asset.brand}` : ""}${asset.model ? ` ${asset.model}` : ""}`}
            leading={
               <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-500/12 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                  <ComputerDesktopIcon className="h-8 w-8" aria-hidden="true" />
               </span>
            }
            tone="admin"
            actions={
               <div className="flex flex-wrap gap-2">
                  <Link
                     href="/admin/assets"
                     className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-2.5 text-sm font-bold text-navy-700 transition-colors hover:border-brand-400 hover:text-brand-800 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200"
                  >
                     <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                     {fa.assets.backToList}
                  </Link>
                  {canWrite ? (
                     <Link
                        href={`/admin/assets/${asset.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all hover:brightness-110"
                     >
                        <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                        {fa.assets.detail.editAction}
                     </Link>
                  ) : null}
               </div>
            }
         />

         {notice ? <AdminNotice tone="success">{notice}</AdminNotice> : null}
         {error ? <AdminNotice tone="error">{error}</AdminNotice> : null}

         <StatStrip
            columns={4}
            items={[
               {
                  value: fa.assets.statuses[asset.status] ?? asset.status,
                  label: fa.assets.columns.status,
                  icon: <CheckCircleIcon className="h-5 w-5" />,
               },
               {
                  value: currentName ?? fa.assets.unassignedBadge,
                  label: fa.assets.detail.currentAssignee,
                  icon: <UserPlusIcon className="h-5 w-5" />,
               },
               {
                  value: `${fa.assets.categories[asset.category] ?? asset.category} · ${fa.assets.types[asset.type] ?? asset.type}`,
                  label: fa.assets.columns.category,
               },
               {
                  value: asset.location ? `${asset.location.floor} / ${asset.location.roomNumber}` : "—",
                  label: fa.assets.columns.location,
               },
            ]}
         />

         <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
               tone={
                  asset.status === "ACTIVE"
                     ? "approved"
                     : asset.status === "IN_REPAIR"
                       ? "pending"
                       : asset.status === "LOST"
                         ? "rejected"
                         : asset.status === "IN_STORAGE"
                           ? "info"
                           : "neutral"
               }
               label={fa.assets.statuses[asset.status] ?? asset.status}
            />
            <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-navy-600 dark:bg-navy-800 dark:text-navy-300">
               {fa.assets.categories[asset.category] ?? asset.category}
            </span>
            <span className="rounded-full bg-brand-500/12 px-3 py-1 text-xs font-bold text-brand-700 dark:text-brand-200">
               {fa.assets.types[asset.type] ?? asset.type}
            </span>
         </div>

         <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
               <FormSection title={fa.assets.detail.overviewTitle} hint={fa.assets.detail.overviewDescription}>
                  <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                     <InfoRow label={fa.assets.detail.assetCode} value={<span dir="ltr" className="font-mono">{asset.assetCode}</span>} />
                     <InfoRow label={fa.assets.detail.name} value={asset.name} />
                     <InfoRow label={fa.assets.detail.category} value={fa.assets.categories[asset.category] ?? asset.category} />
                     <InfoRow label={fa.assets.detail.type} value={fa.assets.types[asset.type] ?? asset.type} />
                     <InfoRow label={fa.assets.detail.status} value={fa.assets.statuses[asset.status] ?? asset.status} />
                     <InfoRow label={fa.assets.detail.brand} value={asset.brand} />
                     <InfoRow label={fa.assets.detail.model} value={asset.model} />
                     <InfoRow label={fa.assets.detail.serialNumber} value={asset.serialNumber} ltr />
                     <InfoRow label={fa.assets.detail.orgUnit} value={asset.orgUnit?.name} />
                     <InfoRow
                        label={fa.assets.detail.location}
                        value={asset.location ? `${asset.location.floor} / ${asset.location.roomNumber}` : null}
                     />
                     <InfoRow
                        label={fa.assets.detail.parentAsset}
                        value={
                           asset.parentAsset ? (
                              <Link href={`/admin/assets/${asset.parentAsset.id}`} className="text-brand-700 hover:underline dark:text-brand-200">
                                 {asset.parentAsset.assetCode} — {asset.parentAsset.name}
                              </Link>
                           ) : (
                              fa.assets.detail.noParent
                           )
                        }
                     />
                  </div>
                  {asset.notes ? (
                     <div className="mt-5 rounded-2xl bg-surface-muted/70 px-4 py-3 dark:bg-navy-900/50">
                        <p className="text-xs font-bold text-navy-500 dark:text-navy-400">{fa.assets.detail.notes}</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-navy-700 dark:text-navy-200">{asset.notes}</p>
                     </div>
                  ) : null}
               </FormSection>

               <FormSection title={fa.assets.detail.specificationsTitle} hint={fa.assets.detail.specificationsDescription}>
                  <TechnicalDetails asset={asset} />
               </FormSection>

               <FormSection title={fa.assets.detail.historyTitle} hint={fa.assets.detail.assignmentDescription}>
                  {asset.assignments.length === 0 ? (
                     <EmptyState
                        icon={<ClockIcon className="h-6 w-6" />}
                        title={fa.assets.detail.noHistoryTitle}
                        body={fa.assets.detail.noHistoryBody}
                        tone="accent"
                     />
                  ) : (
                     <ol className="relative space-y-5 border-s border-border-subtle ps-5 dark:border-navy-700">
                        {asset.assignments.map((assignment) => (
                           <li key={assignment.id} className="relative">
                              <span
                                 aria-hidden="true"
                                 className={`absolute -start-[1.55rem] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface dark:ring-navy-900 ${
                                    assignment.returnedAt ? "bg-navy-300 dark:bg-navy-600" : "bg-brand-500"
                                 }`}
                              />
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                 <Link
                                    href={`/admin/employees/${assignment.employee.id}`}
                                    className="text-sm font-extrabold text-navy-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-200"
                                 >
                                    {assignment.employee.firstName} {assignment.employee.lastName}
                                 </Link>
                                 <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                       assignment.returnedAt
                                          ? "bg-surface-muted text-navy-500 dark:bg-navy-800 dark:text-navy-400"
                                          : "bg-brand-500/12 text-brand-700 dark:text-brand-200"
                                    }`}
                                 >
                                    {assignment.returnedAt ? fa.assets.detail.history.closed : fa.assets.detail.history.open}
                                 </span>
                              </div>
                              <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                                 {fa.assets.detail.history.assigned}: {formatDateTime(assignment.assignedAt)}
                                 {assignment.returnedAt ? ` · ${fa.assets.detail.history.returned}: ${formatDateTime(assignment.returnedAt)}` : ""}
                              </p>
                              {assignment.note ? (
                                 <p className="mt-2 rounded-xl bg-surface-muted/70 px-3 py-2 text-xs leading-6 text-navy-600 dark:bg-navy-900/50 dark:text-navy-300">
                                    {assignment.note}
                                 </p>
                              ) : null}
                              {assignment.returnNote ? (
                                 <p className="mt-2 rounded-xl bg-accent-500/10 px-3 py-2 text-xs leading-6 text-accent-900 dark:text-accent-100">
                                    {assignment.returnNote}
                                 </p>
                              ) : null}
                              <p className="mt-1.5 text-[11px] text-navy-400 dark:text-navy-500">
                                 {assignment.assignedBy
                                    ? fa.assets.detail.history.by.replace(
                                         "{name}",
                                         `${assignment.assignedBy.firstName} ${assignment.assignedBy.lastName}`,
                                      )
                                    : fa.assets.detail.history.system}
                              </p>
                           </li>
                        ))}
                     </ol>
                  )}
               </FormSection>

               <FormSection title={fa.assets.detail.componentsTitle} hint={fa.assets.detail.componentsDescription}>
                  {asset.components.length === 0 ? (
                     <EmptyState
                        icon={<ComputerDesktopIcon className="h-6 w-6" />}
                        title={fa.assets.detail.noComponentsTitle}
                        body={fa.assets.detail.noComponentsBody}
                        tone="brand"
                     />
                  ) : (
                     <div className="grid gap-3 sm:grid-cols-2">
                        {asset.components.map((component) => (
                           <Link
                              key={component.id}
                              href={`/admin/assets/${component.id}`}
                              className="rounded-2xl border border-border-subtle px-4 py-3 transition-colors hover:border-brand-400 dark:border-navy-700"
                           >
                              <div className="flex items-center justify-between gap-2">
                                 <p className="text-sm font-extrabold text-navy-900 dark:text-white">{component.name}</p>
                                 <StatusBadge
                                    tone={component.status === "ACTIVE" ? "approved" : component.status === "IN_REPAIR" ? "pending" : "neutral"}
                                    label={fa.assets.statuses[component.status] ?? component.status}
                                 />
                              </div>
                              <p dir="ltr" className="mt-1 font-mono text-[11px] text-brand-700 dark:text-brand-200">
                                 {component.assetCode}
                              </p>
                              <p className="mt-0.5 text-xs text-navy-500 dark:text-navy-400">{fa.assets.types[component.type] ?? component.type}</p>
                           </Link>
                        ))}
                     </div>
                  )}
               </FormSection>

               <ActivitySection asset={asset} />
            </div>

            <aside className="space-y-6">
               <FormSection title={fa.assets.detail.assignmentTitle} hint={fa.assets.detail.assignmentDescription}>
                  {current ? (
                     <div className="space-y-4">
                        <div className="rounded-2xl bg-brand-50/70 px-4 py-4 dark:bg-brand-500/10">
                           <p className="text-xs font-bold text-brand-700 dark:text-brand-200">{fa.assets.detail.currentAssignee}</p>
                           <Link
                              href={`/admin/employees/${current.employee.id}`}
                              className="mt-1 block text-base font-extrabold text-navy-950 hover:text-brand-700 dark:text-white dark:hover:text-brand-200"
                           >
                              {current.employee.firstName} {current.employee.lastName}
                           </Link>
                           <p className="mt-1 text-xs text-navy-500 dark:text-navy-300">
                              {fa.assets.detail.assignedAt}: {formatDate(current.assignedAt)}
                           </p>
                           {current.employee.orgUnit ? (
                              <p className="mt-1 text-xs text-navy-500 dark:text-navy-300">{current.employee.orgUnit.name}</p>
                           ) : null}
                        </div>

                        {canWrite ? (
                           <div className="space-y-2">
                              <button
                                 type="button"
                                 onClick={() => setAssigning(true)}
                                 className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-subtle px-3 py-2.5 text-xs font-bold text-navy-700 transition-colors hover:border-brand-400 hover:text-brand-800 dark:border-navy-700 dark:text-navy-200"
                              >
                                 <UserPlusIcon className="h-4 w-4" aria-hidden="true" />
                                 {fa.assets.detail.assignAction}
                              </button>
                              <button
                                 type="button"
                                 onClick={() => setReturning(true)}
                                 className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent-300 px-3 py-2.5 text-xs font-bold text-accent-900 transition-colors hover:bg-accent-50 dark:border-accent-500/40 dark:text-accent-100 dark:hover:bg-accent-500/10"
                              >
                                 <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" />
                                 {fa.assets.detail.returnAction}
                              </button>
                           </div>
                        ) : null}
                     </div>
                  ) : (
                     <div className="space-y-4">
                        <EmptyState
                           icon={<UserPlusIcon className="h-6 w-6" />}
                           title={fa.assets.detail.noAssignmentTitle}
                           body={fa.assets.detail.noAssignmentBody}
                           tone="brand"
                        />
                        {canWrite ? (
                           <button
                              type="button"
                              onClick={() => setAssigning(true)}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-l from-brand-700 to-brand-800 px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-700/25 transition-all hover:brightness-110"
                           >
                              <UserPlusIcon className="h-4 w-4" aria-hidden="true" />
                              {fa.assets.detail.assignAction}
                           </button>
                        ) : null}
                     </div>
                  )}
               </FormSection>

               <FormSection title={fa.assets.detail.overviewTitle}>
                  <div className="space-y-4">
                     <InfoRow label={fa.assets.detail.assetCode} value={<span dir="ltr" className="font-mono">{asset.assetCode}</span>} />
                     <InfoRow label={fa.assets.detail.orgUnit} value={asset.orgUnit?.name} />
                     <InfoRow
                        label={fa.assets.detail.location}
                        value={asset.location ? `${asset.location.floor} / ${asset.location.roomNumber}` : null}
                     />
                     <InfoRow label={fa.assets.detail.serialNumber} value={asset.serialNumber} ltr />
                  </div>
                  {canDelete ? (
                     <div className="mt-5 border-t border-border-subtle pt-4">
                        <button
                           type="button"
                           onClick={() => {
                              setError(null)
                              setDeleting(true)
                           }}
                           className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 px-3 py-2.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-50 dark:border-red-500/40 dark:text-red-200 dark:hover:bg-red-500/10"
                        >
                           <TrashIcon className="h-4 w-4" aria-hidden="true" />
                           {fa.assets.detail.deleteAction}
                        </button>
                     </div>
                  ) : null}
               </FormSection>
            </aside>
         </div>

         {assigning ? (
            <AssetAssignmentDialog
               assetId={asset.id}
               assetName={asset.name}
               currentAssignee={currentName}
               onClose={() => setAssigning(false)}
               onDone={() => {
                  setAssigning(false)
                  setNotice(fa.assets.assign.done)
                  router.refresh()
               }}
            />
         ) : null}

         {returning ? (
            <AssetReturnDialog
               assetId={asset.id}
               assetName={asset.name}
               onClose={() => setReturning(false)}
               onDone={() => {
                  setReturning(false)
                  setNotice(fa.assets.assign.returnDone)
                  router.refresh()
               }}
            />
         ) : null}

         {deleting ? (
            <ConfirmDialog
               title={fa.assets.detail.deleteTitle}
               body={fa.assets.detail.deleteBody.replace("{name}", asset.name)}
               confirmLabel={fa.assets.detail.deleteAction}
               busy={busy}
               destructive
               onClose={() => setDeleting(false)}
               onConfirm={remove}
            />
         ) : null}
      </div>
   )
}

function InfoRow({ label, value, ltr = false }: { label: string; value: ReactNode; ltr?: boolean }) {
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

function TechnicalDetails({ asset }: { asset: AssetDetailDto }) {
   const groups: { title: string; rows: { label: string; value: ReactNode }[] }[] = []

   if (asset.computer) {
      const rows = [
         row(fa.assets.fields.systemType, asset.computer.systemType),
         row(fa.assets.fields.motherboardBrand, asset.computer.motherboardBrand),
         row(fa.assets.fields.motherboardModel, asset.computer.motherboardModel),
         row(fa.assets.fields.cpuTier, asset.computer.cpuTier),
         row(fa.assets.fields.cpuModel, asset.computer.cpuModel),
         row(fa.assets.fields.ramAmountGb, asset.computer.ramAmountGb),
         row(fa.assets.fields.ramType, asset.computer.ramType),
         row(fa.assets.fields.storageInfo, asset.computer.storageInfo),
         row(fa.assets.fields.gpuType, asset.computer.gpuType),
         row(fa.assets.fields.gpuBrand, asset.computer.gpuBrand),
         row(fa.assets.fields.gpuModel, asset.computer.gpuModel),
         row(fa.assets.fields.gpuMemoryMb, asset.computer.gpuMemoryMb),
         row(fa.assets.fields.caseBrand, asset.computer.caseBrand),
         row(fa.assets.fields.caseModel, asset.computer.caseModel),
         row(fa.assets.fields.psuBrand, asset.computer.psuBrand),
         row(fa.assets.fields.psuModel, asset.computer.psuModel),
         row(fa.assets.fields.hasDvdWriter, booleanText(asset.computer.hasDvdWriter)),
         row(fa.assets.fields.hasSeparateSpeaker, booleanText(asset.computer.hasSeparateSpeaker)),
         row(fa.assets.fields.speakerType, asset.computer.speakerType),
         row(fa.assets.fields.monitorInfo, asset.computer.monitorInfo),
         row(fa.assets.fields.osName, asset.computer.osName),
         row(fa.assets.fields.osEdition, asset.computer.osEdition),
         row(fa.assets.fields.osVersion, asset.computer.osVersion),
         row(fa.assets.fields.osInstalledOn, dateText(asset.computer.osInstalledOn)),
         row(fa.assets.fields.osBuild, asset.computer.osBuild),
         row(fa.assets.fields.officeVersion, asset.computer.officeVersion),
         row(fa.assets.fields.systemUsername, asset.computer.systemUsername),
         row(fa.assets.fields.automationUsername, asset.computer.automationUsername),
      ].filter((item) => item.value !== null && item.value !== undefined && item.value !== "")
      if (rows.length) groups.push({ title: fa.assets.form.hardwareDetails, rows })
   }

   if (asset.monitor) {
      const rows = [
         row(fa.assets.fields.sizeInches, asset.monitor.sizeInches),
         row(fa.assets.fields.panelType, asset.monitor.panelType),
         row(fa.assets.fields.resolution, asset.monitor.resolution),
      ].filter((item) => item.value !== null && item.value !== undefined && item.value !== "")
      if (rows.length) groups.push({ title: fa.assets.form.monitorDetails, rows })
   }

   if (asset.peripheral) {
      const rows = [
         row(fa.assets.fields.connectionType, asset.peripheral.connectionType),
         row(fa.assets.fields.printerType, asset.peripheral.printerType),
         row(fa.assets.fields.cartridgeModel, asset.peripheral.cartridgeModel),
         row(fa.assets.fields.speakerType, asset.peripheral.speakerType),
      ].filter((item) => item.value !== null && item.value !== undefined && item.value !== "")
      if (rows.length) groups.push({ title: fa.assets.form.peripheralDetails, rows })
   }

   if (asset.network) {
      const rows = [
         row(fa.assets.fields.ipAddress, asset.network.ipAddress),
         row(fa.assets.fields.netboxTitle, asset.network.netboxTitle),
         row(fa.assets.fields.hostname, asset.network.hostname),
         row(fa.assets.fields.macAddress, asset.network.macAddress),
         row(fa.assets.fields.networkType, asset.network.networkType),
         row(fa.assets.fields.port, asset.network.port),
      ].filter((item) => item.value !== null && item.value !== undefined && item.value !== "")
      if (rows.length) groups.push({ title: fa.assets.form.networkDetails, rows })
   }

   if (asset.software) {
      const rows = [
         row(fa.assets.fields.vendor, asset.software.vendor),
         row(fa.assets.fields.version, asset.software.version),
         row(fa.assets.fields.edition, asset.software.edition),
         row(fa.assets.fields.licenseType, asset.software.licenseType),
         row(fa.assets.fields.seatCount, asset.software.seatCount),
         row(fa.assets.fields.licenseExpiry, dateText(asset.software.licenseExpiry)),
         row(fa.assets.fields.installedOn, dateText(asset.software.installedOn)),
      ].filter((item) => item.value !== null && item.value !== undefined && item.value !== "")
      if (rows.length) groups.push({ title: fa.assets.form.softwareDetails, rows })
   }

   if (groups.length === 0) {
      return (
         <p className="rounded-2xl bg-surface-muted/70 px-4 py-3 text-sm text-navy-500 dark:bg-navy-900/50 dark:text-navy-400">
            {fa.assets.detail.noSpecifications}
         </p>
      )
   }

   return (
      <div className="space-y-6">
         {groups.map((group) => (
            <div key={group.title}>
               <h3 className="mb-3 text-sm font-extrabold text-brand-700 dark:text-brand-200">{group.title}</h3>
               <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.rows.map((item) => (
                     <InfoRow key={item.label} label={item.label} value={item.value} />
                  ))}
               </div>
            </div>
         ))}
      </div>
   )
}

function ActivitySection({ asset }: { asset: AssetDetailDto }) {
   const hasAny = asset.maintenance.length > 0 || asset.operations.length > 0 || asset.inspections.length > 0
   if (!hasAny) {
      return (
         <FormSection title={fa.assets.detail.maintenanceTitle}>
            <EmptyState
               icon={<WrenchScrewdriverIcon className="h-6 w-6" />}
               title={fa.assets.detail.noMaintenanceTitle}
               body={fa.assets.detail.noMaintenanceBody}
               tone="accent"
            />
         </FormSection>
      )
   }

   return (
      <FormSection title={fa.assets.detail.maintenanceTitle}>
         <div className="space-y-6">
            {asset.maintenance.length > 0 ? (
               <div>
                  <h3 className="mb-3 text-sm font-extrabold text-brand-700 dark:text-brand-200">{fa.assets.detail.maintenanceTitle}</h3>
                  <ul className="space-y-3">
                     {asset.maintenance.map((record) => (
                        <li key={record.id} className="rounded-2xl border border-border-subtle px-4 py-3 dark:border-navy-700">
                           <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-bold text-navy-900 dark:text-white">{record.title}</p>
                              <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[10px] font-bold text-navy-600 dark:bg-navy-800 dark:text-navy-300">
                                 {fa.assets.detail.maintenanceStatuses[record.status] ?? record.status}
                              </span>
                           </div>
                           <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">
                              {fa.assets.detail.maintenanceTypes[record.type] ?? record.type} ·{" "}
                              {formatDate(record.scheduledFor ?? record.completedAt ?? record.createdAt)}
                           </p>
                           {record.description ? <p className="mt-1 text-xs leading-6 text-navy-600 dark:text-navy-300">{record.description}</p> : null}
                        </li>
                     ))}
                  </ul>
               </div>
            ) : null}

            {asset.operations.length > 0 ? (
               <div>
                  <h3 className="mb-3 text-sm font-extrabold text-brand-700 dark:text-brand-200">{fa.assets.detail.operationsTitle}</h3>
                  <ul className="space-y-2">
                     {asset.operations.map((operation) => (
                        <li key={operation.id} className="rounded-2xl bg-surface-muted/60 px-4 py-3 text-xs dark:bg-navy-900/50">
                           <p className="font-bold text-navy-800 dark:text-navy-100">{operation.operationType}</p>
                           <p className="mt-1 text-navy-500 dark:text-navy-400">
                              {formatDateTime(operation.performedAt)}
                              {operation.employeeName ? ` · ${operation.employeeName}` : ""}
                           </p>
                           {operation.description ? <p className="mt-1 leading-6 text-navy-600 dark:text-navy-300">{operation.description}</p> : null}
                        </li>
                     ))}
                  </ul>
               </div>
            ) : null}

            {asset.inspections.length > 0 ? (
               <div>
                  <h3 className="mb-3 text-sm font-extrabold text-brand-700 dark:text-brand-200">{fa.assets.detail.inspectionsTitle}</h3>
                  <ul className="space-y-2">
                     {asset.inspections.map((inspection) => (
                        <li key={inspection.id} className="rounded-2xl bg-surface-muted/60 px-4 py-3 text-xs dark:bg-navy-900/50">
                           <p className="font-bold text-navy-800 dark:text-navy-100">
                              {inspection.visitType ?? fa.assets.detail.inspectionsTitle}
                           </p>
                           <p className="mt-1 text-navy-500 dark:text-navy-400">{formatDateTime(inspection.visitedAt)}</p>
                           {inspection.description ? <p className="mt-1 leading-6 text-navy-600 dark:text-navy-300">{inspection.description}</p> : null}
                        </li>
                     ))}
                  </ul>
               </div>
            ) : null}
         </div>
      </FormSection>
   )
}

function row(label: string, value: string | number | null | undefined): { label: string; value: ReactNode } {
   return { label, value: value === null || value === undefined || value === "" ? null : String(value) }
}

function booleanText(value: boolean | null): string | null {
   if (value === null) return null
   return value ? fa.common.yes : fa.common.no
}

function dateText(value: string | null): string | null {
   return value ? formatDate(value) : null
}
