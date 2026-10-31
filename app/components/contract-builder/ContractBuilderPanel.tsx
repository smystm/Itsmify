"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import {
   ArrowLeftIcon,
   ArrowPathIcon,
   ArrowsPointingOutIcon,
   BoltIcon,
   BuildingStorefrontIcon,
   CheckCircleIcon,
   CircleStackIcon,
   CommandLineIcon,
   ComputerDesktopIcon,
   CpuChipIcon,
   CubeIcon,
   DocumentTextIcon,
   KeyIcon,
   LinkIcon,
   PrinterIcon,
   PuzzlePieceIcon,
   RectangleGroupIcon,
   RectangleStackIcon,
   SpeakerWaveIcon,
   Square3Stack3DIcon,
   Squares2X2Icon,
   SwatchIcon,
   TagIcon,
   WifiIcon,
} from "@heroicons/react/24/outline"
import PageHero from "@/app/components/ui/PageHero"
import AdminNotice from "@/app/components/ui/AdminNotice"
import { getJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import {
   CONTRACT_GROUPS,
   CONTRACT_OPTION_KINDS,
   type ContractGroupId,
   type ContractOptionKind,
} from "@/lib/contracts/kinds"
import { groupContractOptions, type ContractOptionDto, type ContractOptionsByKind } from "@/lib/contracts/types"
import ManageContractOptionsDialog from "./ManageContractOptionsDialog"

const GROUP_ICONS: Record<ContractGroupId, ReactNode> = {
   identity: <SwatchIcon className="h-5 w-5" aria-hidden="true" />,
   computer: <CpuChipIcon className="h-5 w-5" aria-hidden="true" />,
   software: <CommandLineIcon className="h-5 w-5" aria-hidden="true" />,
   monitor: <ComputerDesktopIcon className="h-5 w-5" aria-hidden="true" />,
   peripheral: <PuzzlePieceIcon className="h-5 w-5" aria-hidden="true" />,
   network: <WifiIcon className="h-5 w-5" aria-hidden="true" />,
}

const KIND_ICONS: Record<ContractOptionKind, ReactNode> = {
   BRAND: <BuildingStorefrontIcon className="h-4 w-4" aria-hidden="true" />,
   SYSTEM_TYPE: <ComputerDesktopIcon className="h-4 w-4" aria-hidden="true" />,
   MOTHERBOARD_BRAND: <Square3Stack3DIcon className="h-4 w-4" aria-hidden="true" />,
   CPU_TIER: <CpuChipIcon className="h-4 w-4" aria-hidden="true" />,
   RAM_TYPE: <CircleStackIcon className="h-4 w-4" aria-hidden="true" />,
   GPU_TYPE: <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />,
   GPU_BRAND: <RectangleGroupIcon className="h-4 w-4" aria-hidden="true" />,
   CASE_BRAND: <CubeIcon className="h-4 w-4" aria-hidden="true" />,
   PSU_BRAND: <BoltIcon className="h-4 w-4" aria-hidden="true" />,
   SPEAKER_TYPE: <SpeakerWaveIcon className="h-4 w-4" aria-hidden="true" />,
   OS_NAME: <CommandLineIcon className="h-4 w-4" aria-hidden="true" />,
   OS_EDITION: <TagIcon className="h-4 w-4" aria-hidden="true" />,
   OFFICE_VERSION: <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />,
   PANEL_TYPE: <ComputerDesktopIcon className="h-4 w-4" aria-hidden="true" />,
   RESOLUTION: <ArrowsPointingOutIcon className="h-4 w-4" aria-hidden="true" />,
   CONNECTION_TYPE: <LinkIcon className="h-4 w-4" aria-hidden="true" />,
   PRINTER_TYPE: <PrinterIcon className="h-4 w-4" aria-hidden="true" />,
   NETWORK_TYPE: <WifiIcon className="h-4 w-4" aria-hidden="true" />,
   SOFTWARE_VENDOR: <BuildingStorefrontIcon className="h-4 w-4" aria-hidden="true" />,
   LICENSE_TYPE: <KeyIcon className="h-4 w-4" aria-hidden="true" />,
   SOFTWARE_EDITION: <RectangleStackIcon className="h-4 w-4" aria-hidden="true" />,
}

export default function ContractBuilderPanel() {
   const [options, setOptions] = useState<ContractOptionsByKind | null>(null)
   const [loading, setLoading] = useState(true)
   const [loadError, setLoadError] = useState<string | null>(null)
   const [activeKind, setActiveKind] = useState<ContractOptionKind | null>(null)

   const loadOptions = useCallback(async () => {
      setLoading(true)
      setLoadError(null)
      try {
         const result = await getJson<{ options: ContractOptionDto[] }>("/api/admin/contract-options")
         setOptions(groupContractOptions(result.options))
      } catch (err) {
         console.error("contract options load failed", err)
         setLoadError(fa.contractBuilder.loadError)
      } finally {
         setLoading(false)
      }
   }, [])

   useEffect(() => {
      /* eslint-disable react-hooks/set-state-in-effect -- entering the initial request is an intentional transition */
      void loadOptions()
      /* eslint-enable react-hooks/set-state-in-effect */
   }, [loadOptions])

   const totalCount = options
      ? CONTRACT_OPTION_KINDS.reduce((sum, kind) => sum + options[kind].length, 0)
      : 0
   const totalLabel = options
      ? fa.contractBuilder.totalCount
           .replace("{count}", totalCount.toLocaleString("fa-IR"))
           .replace("{lists}", CONTRACT_OPTION_KINDS.length.toLocaleString("fa-IR"))
      : loading
        ? fa.common.loading
        : "—"

   const countLabel = (kind: ContractOptionKind) =>
      options
         ? fa.contractBuilder.count.replace("{count}", options[kind].length.toLocaleString("fa-IR"))
         : loading
           ? fa.common.loading
           : "—"

   return (
      <div className="space-y-6">
         <PageHero
            badge={fa.contractBuilder.badge}
            title={fa.contractBuilder.title}
            description={fa.contractBuilder.description}
            actions={
               <span className="rounded-full border border-brand-500/20 bg-surface/80 px-4 py-2 text-xs font-bold text-brand-700 backdrop-blur dark:border-brand-400/25 dark:bg-navy-900/70 dark:text-brand-200">
                  {totalLabel}
               </span>
            }
            tone="admin"
         />

         {loadError ? (
            <AdminNotice tone="error">
               <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>{loadError}</span>
                  <button
                     type="button"
                     onClick={() => void loadOptions()}
                     className="inline-flex items-center gap-1.5 font-bold underline underline-offset-4"
                  >
                     <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                     {fa.common.retry}
                  </button>
               </div>
            </AdminNotice>
         ) : null}

         {CONTRACT_GROUPS.map((group) => {
            const meta = fa.contractBuilder.groups[group.id]
            const groupCount = options
               ? group.kinds.reduce((sum, kind) => sum + options[kind].length, 0)
               : 0

            return (
               <section
                  key={group.id}
                  className="animate-fade-in-up rounded-3xl border border-border-subtle bg-surface p-5 shadow-lg shadow-navy-900/5 dark:shadow-black/20 sm:p-6"
               >
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-4">
                     <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                           {GROUP_ICONS[group.id]}
                        </span>
                        <div>
                           <h2 className="text-base font-extrabold text-navy-950 dark:text-white">{meta.title}</h2>
                           <p className="mt-1 text-xs leading-6 text-navy-500 dark:text-navy-400">{meta.description}</p>
                        </div>
                     </div>
                     <span className="rounded-full bg-surface-muted px-3 py-1 text-[11px] font-bold text-navy-600 dark:bg-navy-800 dark:text-navy-200">
                        {options
                           ? fa.contractBuilder.count.replace("{count}", groupCount.toLocaleString("fa-IR"))
                           : loading
                             ? fa.common.loading
                             : "—"}
                     </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                     {group.kinds.map((kind) => {
                        const kindMeta = fa.contractBuilder.kinds[kind]
                        return (
                           <button
                              key={kind}
                              type="button"
                              onClick={() => setActiveKind(kind)}
                              className="group flex h-full items-center gap-4 rounded-2xl border border-border-subtle bg-surface-muted/40 p-3 text-start transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-400 hover:bg-surface hover:shadow-md hover:shadow-navy-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:border-navy-700 dark:bg-navy-900/40 dark:hover:bg-navy-900 dark:hover:shadow-black/20"
                           >
                              {/* Icon */}
                              <span className="flex h-18 w-18 shrink-0 items-center justify-center rounded-2xl border border-brand-500/10 bg-brand-500/10 text-brand-700 transition-all duration-300 group-hover:scale-105 group-hover:bg-brand-500/15 dark:border-brand-500/20 dark:bg-brand-500/15 dark:text-brand-200">
                                 <span className="[&>svg]:h-9 [&>svg]:w-9">
                                    {KIND_ICONS[kind]}
                                 </span>
                              </span>

                              {/* Content */}
                              <span className="flex min-w-0 flex-1 flex-col self-stretch py-0.5">
                                 <span className="flex items-center justify-between gap-2">
                                    <span className="min-w-0 text-sm font-extrabold leading-6 text-navy-950 dark:text-white">
                                       {kindMeta.label}
                                    </span>

                                    <span className="shrink-0 rounded-lg bg-surface px-2.5 py-1 text-[11px] font-bold text-brand-700 ring-1 ring-border-subtle dark:bg-navy-800 dark:text-brand-200 dark:ring-navy-700">
                                       {countLabel(kind)}
                                    </span>
                                 </span>

                                 <span className="mt-1 text-xs leading-6 text-navy-500 dark:text-navy-400">
                                    {kindMeta.description}
                                 </span>

                                 <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-xs font-bold text-brand-700 dark:text-brand-200">
                                    {fa.contractBuilder.tileAction}
                                    <ArrowLeftIcon
                                       className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1"
                                       aria-hidden="true"
                                    />
                                 </span>
                              </span>
                           </button>
                        )
                     })}
                  </div>
               </section>
            )
         })}

         <section className="animate-fade-in-up rounded-3xl border border-border-subtle bg-surface-muted/40 p-5 sm:p-6 dark:border-navy-700 dark:bg-navy-900/40">
            <h3 className="text-sm font-extrabold text-navy-950 dark:text-white">{fa.contractBuilder.infoTitle}</h3>
            <ul role="list" className="mt-4 space-y-3">
               {fa.contractBuilder.infoPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm leading-6 text-navy-600 dark:text-navy-300">
                     <CheckCircleIcon
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300"
                        aria-hidden="true"
                     />
                     {point}
                  </li>
               ))}
            </ul>
         </section>

         {activeKind ? (
            <ManageContractOptionsDialog
               kind={activeKind}
               options={options?.[activeKind] ?? []}
               onReload={loadOptions}
               onClose={() => setActiveKind(null)}
            />
         ) : null}
      </div>
   )
}
