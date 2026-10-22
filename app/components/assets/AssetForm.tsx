"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRightIcon, CheckIcon } from "@heroicons/react/24/outline"
import type { FormikHelpers } from "formik"
import { FormShell } from "@/app/components/auth/FormShell"
import PageHero from "@/app/components/ui/PageHero"
import FormSection from "@/app/components/ui/FormSection"
import InputField from "@/app/components/ui/InputField"
import SelectField from "@/app/components/ui/SelectField"
import TextareaField from "@/app/components/ui/TextareaField"
import CheckboxField from "@/app/components/ui/CheckboxField"
import AdminNotice from "@/app/components/ui/AdminNotice"
import EmployeePicker from "./EmployeePicker"
import ParentAssetSelect from "./ParentAssetSelect"
import { ApiError, patchJson, postJson } from "@/app/helpers/API"
import { fa } from "@/lib/i18n/fa"
import {
   TYPES_BY_CATEGORY,
   createAssetSchema,
   updateAssetSchema,
   type AssetCategoryValue,
} from "@/lib/assets/validation"
import type { AssetDetailDto } from "@/lib/assets/types"

interface ComputerValues {
   systemType: string
   motherboardBrand: string
   motherboardModel: string
   cpuTier: string
   cpuModel: string
   ramAmountGb: string
   ramType: string
   storageInfo: string
   gpuType: string
   gpuBrand: string
   gpuModel: string
   gpuMemoryMb: string
   caseBrand: string
   caseModel: string
   psuBrand: string
   psuModel: string
   hasDvdWriter: boolean
   hasSeparateSpeaker: boolean
   speakerType: string
   monitorInfo: string
   osName: string
   osEdition: string
   osVersion: string
   osInstalledOn: string
   osBuild: string
   officeVersion: string
   systemUsername: string
   automationUsername: string
}

interface MonitorValues {
   sizeInches: string
   panelType: string
   resolution: string
}

interface PeripheralValues {
   connectionType: string
   printerType: string
   cartridgeModel: string
   speakerType: string
}

interface NetworkValues {
   ipAddress: string
   netboxTitle: string
   hostname: string
   macAddress: string
   networkType: string
   port: string
}

interface SoftwareValues {
   vendor: string
   version: string
   edition: string
   licenseType: string
   seatCount: string
   licenseExpiry: string
   installedOn: string
}

interface AssetFormValues {
   assetCode: string
   name: string
   category: string
   type: string
   status: string
   brand: string
   model: string
   serialNumber: string
   orgUnitName: string
   floor: string
   roomNumber: string
   parentAssetId: string
   assignedToEmployeeId: string
   assignNote: string
   notes: string
   computer: ComputerValues
   monitor: MonitorValues
   peripheral: PeripheralValues
   network: NetworkValues
   software: SoftwareValues
}

interface AssetFormProps {
   mode: "create" | "edit"
   asset?: AssetDetailDto
}

const PERIPHERAL_TYPES = [
   "PRINTER",
   "SCANNER",
   "COPIER",
   "PROJECTOR",
   "KEYBOARD",
   "MOUSE",
   "SPEAKER",
   "OTHER_HARDWARE",
]

function numberString(value: number | null | undefined): string {
   return value === null || value === undefined ? "" : String(value)
}

function isoDate(value: string | null | undefined): string {
   return value ? value.slice(0, 10) : ""
}

export default function AssetForm({ mode, asset }: AssetFormProps) {
   const router = useRouter()
   const [formError, setFormError] = useState<string | null>(null)

   const initialValues: AssetFormValues = {
      assetCode: asset?.assetCode ?? "",
      name: asset?.name ?? "",
      category: asset?.category ?? "",
      type: asset?.type ?? "",
      status: asset?.status ?? "ACTIVE",
      brand: asset?.brand ?? "",
      model: asset?.model ?? "",
      serialNumber: asset?.serialNumber ?? "",
      orgUnitName: asset?.orgUnit?.name ?? "",
      floor: asset?.location?.floor ?? "",
      roomNumber: asset?.location?.roomNumber ?? "",
      parentAssetId: asset?.parentAsset?.id ?? "",
      assignedToEmployeeId: "",
      assignNote: "",
      notes: "",
      computer: {
         systemType: asset?.computer?.systemType ?? "",
         motherboardBrand: asset?.computer?.motherboardBrand ?? "",
         motherboardModel: asset?.computer?.motherboardModel ?? "",
         cpuTier: asset?.computer?.cpuTier ?? "",
         cpuModel: asset?.computer?.cpuModel ?? "",
         ramAmountGb: numberString(asset?.computer?.ramAmountGb),
         ramType: asset?.computer?.ramType ?? "",
         storageInfo: asset?.computer?.storageInfo ?? "",
         gpuType: asset?.computer?.gpuType ?? "",
         gpuBrand: asset?.computer?.gpuBrand ?? "",
         gpuModel: asset?.computer?.gpuModel ?? "",
         gpuMemoryMb: numberString(asset?.computer?.gpuMemoryMb),
         caseBrand: asset?.computer?.caseBrand ?? "",
         caseModel: asset?.computer?.caseModel ?? "",
         psuBrand: asset?.computer?.psuBrand ?? "",
         psuModel: asset?.computer?.psuModel ?? "",
         hasDvdWriter: asset?.computer?.hasDvdWriter ?? false,
         hasSeparateSpeaker: asset?.computer?.hasSeparateSpeaker ?? false,
         speakerType: asset?.computer?.speakerType ?? "",
         monitorInfo: asset?.computer?.monitorInfo ?? "",
         osName: asset?.computer?.osName ?? "",
         osEdition: asset?.computer?.osEdition ?? "",
         osVersion: asset?.computer?.osVersion ?? "",
         osInstalledOn: isoDate(asset?.computer?.osInstalledOn),
         osBuild: asset?.computer?.osBuild ?? "",
         officeVersion: asset?.computer?.officeVersion ?? "",
         systemUsername: asset?.computer?.systemUsername ?? "",
         automationUsername: asset?.computer?.automationUsername ?? "",
      },
      monitor: {
         sizeInches: numberString(asset?.monitor?.sizeInches),
         panelType: asset?.monitor?.panelType ?? "",
         resolution: asset?.monitor?.resolution ?? "",
      },
      peripheral: {
         connectionType: asset?.peripheral?.connectionType ?? "",
         printerType: asset?.peripheral?.printerType ?? "",
         cartridgeModel: asset?.peripheral?.cartridgeModel ?? "",
         speakerType: asset?.peripheral?.speakerType ?? "",
      },
      network: {
         ipAddress: asset?.network?.ipAddress ?? "",
         netboxTitle: asset?.network?.netboxTitle ?? "",
         hostname: asset?.network?.hostname ?? "",
         macAddress: asset?.network?.macAddress ?? "",
         networkType: asset?.network?.networkType ?? "",
         port: asset?.network?.port ?? "",
      },
      software: {
         vendor: asset?.software?.vendor ?? "",
         version: asset?.software?.version ?? "",
         edition: asset?.software?.edition ?? "",
         licenseType: asset?.software?.licenseType ?? "",
         seatCount: numberString(asset?.software?.seatCount),
         licenseExpiry: isoDate(asset?.software?.licenseExpiry),
         installedOn: isoDate(asset?.software?.installedOn),
      },
   }

   const handleSubmit = async (values: AssetFormValues, helpers: FormikHelpers<AssetFormValues>) => {
      setFormError(null)
      const payload = {
         ...values,
         assetCode: values.assetCode.trim(),
         name: values.name.trim(),
         brand: values.brand.trim(),
         model: values.model.trim(),
         serialNumber: values.serialNumber.trim(),
         orgUnitName: values.orgUnitName.trim(),
         floor: values.floor.trim(),
         roomNumber: values.roomNumber.trim(),
         assignNote: values.assignNote.trim(),
         notes: values.notes.trim(),
      }

      try {
         if (mode === "create") {
            const result = await postJson<{ asset: AssetDetailDto }>("/api/admin/assets", payload)
            router.push(`/admin/assets/${result.asset.id}`)
            router.refresh()
         } else if (asset) {
            await patchJson<{ asset: AssetDetailDto }>(`/api/admin/assets/${asset.id}`, payload)
            router.push(`/admin/assets/${asset.id}`)
            router.refresh()
         }
      } catch (err) {
         if (err instanceof ApiError) {
            if (err.errors && Object.keys(err.errors).length > 0) {
               helpers.setErrors(err.errors)
               setFormError(fa.assets.form.formError)
            } else if (err.code === "invalid_category") {
               setFormError(fa.assets.form.invalidTypeCategory)
            } else {
               setFormError(fa.assets.form.formError)
            }
         } else {
            console.error("asset save failed", err)
            setFormError(fa.assets.form.formError)
         }
      } finally {
         helpers.setSubmitting(false)
      }
   }

   return (
      <div className="space-y-6">
         <PageHero
            badge={fa.assets.workspaceLabel}
            title={mode === "create" ? fa.assets.form.createTitle : fa.assets.form.editTitle}
            description={mode === "create" ? fa.assets.form.createDescription : fa.assets.form.editDescription}
            tone="admin"
            actions={
               <Link
                  href={asset ? `/admin/assets/${asset.id}` : "/admin/assets"}
                  className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-4 py-2.5 text-sm font-bold text-navy-700 transition-colors hover:border-brand-400 hover:text-brand-800 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-200"
               >
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  {fa.common.back}
               </Link>
            }
         />

         {formError ? <AdminNotice tone="error">{formError}</AdminNotice> : null}

         <FormShell<AssetFormValues>
            initialValues={initialValues}
            validationSchema={mode === "create" ? createAssetSchema : updateAssetSchema}
            onSubmit={handleSubmit}
            className="space-y-5"
         >
            {({ isSubmitting, values, touched, errors, setFieldValue }) => {
               const category = values.category as AssetCategoryValue | ""
               const typeOptions = category ? TYPES_BY_CATEGORY[category] ?? [] : []
               const isComputer = values.type === "COMPUTER"
               const isMonitor = values.type === "MONITOR"
               const isPeripheral = PERIPHERAL_TYPES.includes(values.type)
               const isNetwork = values.type === "NETWORK_DEVICE"
               const isSoftware = values.type === "SOFTWARE"
               const computerErrors = (errors.computer ?? {}) as Partial<Record<keyof ComputerValues, string>>
               const computerTouched = (touched.computer ?? {}) as Partial<Record<keyof ComputerValues, boolean>>
               const monitorErrors = (errors.monitor ?? {}) as Partial<Record<keyof MonitorValues, string>>
               const monitorTouched = (touched.monitor ?? {}) as Partial<Record<keyof MonitorValues, boolean>>
               const peripheralErrors = (errors.peripheral ?? {}) as Partial<Record<keyof PeripheralValues, string>>
               const peripheralTouched = (touched.peripheral ?? {}) as Partial<Record<keyof PeripheralValues, boolean>>
               const networkErrors = (errors.network ?? {}) as Partial<Record<keyof NetworkValues, string>>
               const networkTouched = (touched.network ?? {}) as Partial<Record<keyof NetworkValues, boolean>>
               const softwareErrors = (errors.software ?? {}) as Partial<Record<keyof SoftwareValues, string>>
               const softwareTouched = (touched.software ?? {}) as Partial<Record<keyof SoftwareValues, boolean>>

               return (
                  <>
                     <FormSection title={fa.assets.form.sectionIdentity} hint={fa.assets.form.sectionIdentityHint}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                           <InputField
                              name="name"
                              label={fa.assets.form.name}
                              placeholder={fa.assets.form.namePlaceholder}
                              touched={touched.name}
                              error={errors.name}
                           />
                           <InputField
                              name="assetCode"
                              label={fa.assets.form.assetCode}
                              placeholder={fa.assets.form.assetCodePlaceholder}
                              hint={fa.assets.form.assetCodeHint}
                              dir="ltr"
                              autoComplete="off"
                              touched={touched.assetCode}
                              error={errors.assetCode}
                           />
                           <InputField
                              name="brand"
                              label={fa.assets.form.brand}
                              placeholder={fa.assets.form.brandPlaceholder}
                              touched={touched.brand}
                              error={errors.brand}
                           />
                           <InputField
                              name="model"
                              label={fa.assets.form.model}
                              placeholder={fa.assets.form.modelPlaceholder}
                              touched={touched.model}
                              error={errors.model}
                           />
                           <InputField
                              name="serialNumber"
                              label={fa.assets.form.serialNumber}
                              placeholder={fa.assets.form.serialPlaceholder}
                              dir="ltr"
                              autoComplete="off"
                              className="sm:col-span-2"
                              touched={touched.serialNumber}
                              error={errors.serialNumber}
                           />
                        </div>
                     </FormSection>

                     <FormSection title={fa.assets.form.sectionClassification} hint={fa.assets.form.sectionClassificationHint}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                           <SelectField
                              name="category"
                              label={fa.assets.form.category}
                              placeholder={fa.assets.form.categoryPlaceholder}
                              options={[
                                 { value: "HARDWARE", label: fa.assets.categories.HARDWARE },
                                 { value: "SOFTWARE", label: fa.assets.categories.SOFTWARE },
                                 { value: "NETWORK", label: fa.assets.categories.NETWORK },
                              ]}
                              onChange={(value) => {
                                 void setFieldValue("category", value)
                                 void setFieldValue("type", "")
                              }}
                              touched={touched.category}
                              error={errors.category}
                           />
                           <SelectField
                              name="type"
                              label={fa.assets.form.type}
                              placeholder={fa.assets.form.typePlaceholder}
                              options={typeOptions.map((type) => ({
                                 value: type,
                                 label: fa.assets.types[type] ?? type,
                              }))}
                              disabled={!category}
                              touched={touched.type}
                              error={errors.type}
                           />
                           <SelectField
                              name="status"
                              label={fa.assets.form.status}
                              options={Object.entries(fa.assets.statuses).map(([value, label]) => ({ value, label }))}
                              touched={touched.status}
                              error={errors.status}
                           />
                        </div>
                     </FormSection>

                     {mode === "create" ? (
                        <FormSection title={fa.assets.form.sectionAssignment} hint={fa.assets.form.sectionAssignmentHint}>
                           <div className="grid grid-cols-1 gap-4">
                              <div>
                                 <p className="mb-1.5 text-sm font-bold text-navy-800 dark:text-navy-200">
                                    {fa.assets.form.assignedTo}
                                 </p>
                                 <EmployeePicker
                                    value={values.assignedToEmployeeId}
                                    onChange={(employee) => void setFieldValue("assignedToEmployeeId", employee?.profileId ?? "")}
                                 />
                              </div>
                              <TextareaField
                                 name="assignNote"
                                 label={fa.assets.form.assignNote}
                                 rows={2}
                                 placeholder={fa.assets.assign.notePlaceholder}
                                 touched={touched.assignNote}
                                 error={errors.assignNote}
                              />
                           </div>
                        </FormSection>
                     ) : null}

                     <FormSection title={fa.assets.form.sectionLocation} hint={fa.assets.form.sectionLocationHint}>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                           <InputField
                              name="orgUnitName"
                              label={fa.assets.form.orgUnitName}
                              placeholder={fa.assets.form.orgUnitNamePlaceholder}
                              touched={touched.orgUnitName}
                              error={errors.orgUnitName}
                           />
                           <InputField
                              name="floor"
                              label={fa.assets.form.floor}
                              placeholder={fa.assets.form.floorPlaceholder}
                              touched={touched.floor}
                              error={errors.floor}
                           />
                           <InputField
                              name="roomNumber"
                              label={fa.assets.form.roomNumber}
                              placeholder={fa.assets.form.roomNumberPlaceholder}
                              touched={touched.roomNumber}
                              error={errors.roomNumber}
                           />
                        </div>
                        <div className="mt-4">
                           <ParentAssetSelect
                              value={values.parentAssetId}
                              initial={asset?.parentAsset ?? null}
                              excludeId={asset?.id}
                              onChange={(parent) => void setFieldValue("parentAssetId", parent?.id ?? "")}
                           />
                           {typeof errors.parentAssetId === "string" ? (
                              <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{errors.parentAssetId}</p>
                           ) : null}
                        </div>
                     </FormSection>

                     {isComputer || isMonitor || isPeripheral || isNetwork || isSoftware ? (
                        <FormSection title={fa.assets.form.sectionDetails} hint={fa.assets.form.sectionDetailsHint}>
                           {isComputer ? (
                              <div className="space-y-7">
                                 <div>
                                    <h3 className="mb-4 text-sm font-extrabold text-brand-700 dark:text-brand-200">
                                       {fa.assets.form.hardwareDetails}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                       <InputField name="computer.systemType" label={fa.assets.fields.systemType} touched={computerTouched.systemType} error={computerErrors.systemType} />
                                       <InputField name="computer.motherboardBrand" label={fa.assets.fields.motherboardBrand} touched={computerTouched.motherboardBrand} error={computerErrors.motherboardBrand} />
                                       <InputField name="computer.motherboardModel" label={fa.assets.fields.motherboardModel} touched={computerTouched.motherboardModel} error={computerErrors.motherboardModel} />
                                       <InputField name="computer.cpuTier" label={fa.assets.fields.cpuTier} touched={computerTouched.cpuTier} error={computerErrors.cpuTier} />
                                       <InputField name="computer.cpuModel" label={fa.assets.fields.cpuModel} touched={computerTouched.cpuModel} error={computerErrors.cpuModel} />
                                       <InputField name="computer.ramAmountGb" label={fa.assets.fields.ramAmountGb} type="number" step="any" inputMode="decimal" touched={computerTouched.ramAmountGb} error={computerErrors.ramAmountGb} />
                                       <InputField name="computer.ramType" label={fa.assets.fields.ramType} touched={computerTouched.ramType} error={computerErrors.ramType} />
                                       <InputField name="computer.storageInfo" label={fa.assets.fields.storageInfo} touched={computerTouched.storageInfo} error={computerErrors.storageInfo} />
                                       <InputField name="computer.gpuType" label={fa.assets.fields.gpuType} touched={computerTouched.gpuType} error={computerErrors.gpuType} />
                                       <InputField name="computer.gpuBrand" label={fa.assets.fields.gpuBrand} touched={computerTouched.gpuBrand} error={computerErrors.gpuBrand} />
                                       <InputField name="computer.gpuModel" label={fa.assets.fields.gpuModel} touched={computerTouched.gpuModel} error={computerErrors.gpuModel} />
                                       <InputField name="computer.gpuMemoryMb" label={fa.assets.fields.gpuMemoryMb} type="number" step="1" inputMode="numeric" touched={computerTouched.gpuMemoryMb} error={computerErrors.gpuMemoryMb} />
                                       <InputField name="computer.caseBrand" label={fa.assets.fields.caseBrand} touched={computerTouched.caseBrand} error={computerErrors.caseBrand} />
                                       <InputField name="computer.caseModel" label={fa.assets.fields.caseModel} touched={computerTouched.caseModel} error={computerErrors.caseModel} />
                                       <InputField name="computer.psuBrand" label={fa.assets.fields.psuBrand} touched={computerTouched.psuBrand} error={computerErrors.psuBrand} />
                                       <InputField name="computer.psuModel" label={fa.assets.fields.psuModel} touched={computerTouched.psuModel} error={computerErrors.psuModel} />
                                       <InputField name="computer.speakerType" label={fa.assets.fields.speakerType} touched={computerTouched.speakerType} error={computerErrors.speakerType} />
                                       <InputField name="computer.monitorInfo" label={fa.assets.fields.monitorInfo} touched={computerTouched.monitorInfo} error={computerErrors.monitorInfo} />
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                       <CheckboxField name="computer.hasDvdWriter" label={fa.assets.fields.hasDvdWriter} />
                                       <CheckboxField name="computer.hasSeparateSpeaker" label={fa.assets.fields.hasSeparateSpeaker} />
                                    </div>
                                 </div>

                                 <div>
                                    <h3 className="mb-4 text-sm font-extrabold text-brand-700 dark:text-brand-200">
                                       {fa.assets.form.operatingSystem}
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                       <InputField name="computer.osName" label={fa.assets.fields.osName} touched={computerTouched.osName} error={computerErrors.osName} />
                                       <InputField name="computer.osEdition" label={fa.assets.fields.osEdition} touched={computerTouched.osEdition} error={computerErrors.osEdition} />
                                       <InputField name="computer.osVersion" label={fa.assets.fields.osVersion} touched={computerTouched.osVersion} error={computerErrors.osVersion} />
                                       <InputField name="computer.osInstalledOn" label={fa.assets.fields.osInstalledOn} type="date" dir="ltr" touched={computerTouched.osInstalledOn} error={computerErrors.osInstalledOn} />
                                       <InputField name="computer.osBuild" label={fa.assets.fields.osBuild} touched={computerTouched.osBuild} error={computerErrors.osBuild} />
                                       <InputField name="computer.officeVersion" label={fa.assets.fields.officeVersion} touched={computerTouched.officeVersion} error={computerErrors.officeVersion} />
                                       <InputField name="computer.systemUsername" label={fa.assets.fields.systemUsername} dir="ltr" touched={computerTouched.systemUsername} error={computerErrors.systemUsername} />
                                       <InputField name="computer.automationUsername" label={fa.assets.fields.automationUsername} dir="ltr" touched={computerTouched.automationUsername} error={computerErrors.automationUsername} />
                                    </div>
                                 </div>
                              </div>
                           ) : null}

                           {isMonitor ? (
                              <div>
                                 <h3 className="mb-4 text-sm font-extrabold text-brand-700 dark:text-brand-200">
                                    {fa.assets.form.monitorDetails}
                                 </h3>
                                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <InputField name="monitor.sizeInches" label={fa.assets.fields.sizeInches} type="number" step="any" inputMode="decimal" touched={monitorTouched.sizeInches} error={monitorErrors.sizeInches} />
                                    <InputField name="monitor.panelType" label={fa.assets.fields.panelType} touched={monitorTouched.panelType} error={monitorErrors.panelType} />
                                    <InputField name="monitor.resolution" label={fa.assets.fields.resolution} touched={monitorTouched.resolution} error={monitorErrors.resolution} />
                                 </div>
                              </div>
                           ) : null}

                           {isPeripheral ? (
                              <div>
                                 <h3 className="mb-4 text-sm font-extrabold text-brand-700 dark:text-brand-200">
                                    {fa.assets.form.peripheralDetails}
                                 </h3>
                                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <InputField name="peripheral.connectionType" label={fa.assets.fields.connectionType} touched={peripheralTouched.connectionType} error={peripheralErrors.connectionType} />
                                    {["PRINTER", "SCANNER", "COPIER"].includes(values.type) ? (
                                       <>
                                          <InputField name="peripheral.printerType" label={fa.assets.fields.printerType} touched={peripheralTouched.printerType} error={peripheralErrors.printerType} />
                                          <InputField name="peripheral.cartridgeModel" label={fa.assets.fields.cartridgeModel} touched={peripheralTouched.cartridgeModel} error={peripheralErrors.cartridgeModel} />
                                       </>
                                    ) : null}
                                    {values.type === "SPEAKER" ? (
                                       <InputField name="peripheral.speakerType" label={fa.assets.fields.speakerType} touched={peripheralTouched.speakerType} error={peripheralErrors.speakerType} />
                                    ) : null}
                                 </div>
                              </div>
                           ) : null}

                           {isNetwork ? (
                              <div>
                                 <h3 className="mb-4 text-sm font-extrabold text-brand-700 dark:text-brand-200">
                                    {fa.assets.form.networkDetails}
                                 </h3>
                                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <InputField name="network.ipAddress" label={fa.assets.fields.ipAddress} dir="ltr" touched={networkTouched.ipAddress} error={networkErrors.ipAddress} />
                                    <InputField name="network.netboxTitle" label={fa.assets.fields.netboxTitle} touched={networkTouched.netboxTitle} error={networkErrors.netboxTitle} />
                                    <InputField name="network.hostname" label={fa.assets.fields.hostname} dir="ltr" touched={networkTouched.hostname} error={networkErrors.hostname} />
                                    <InputField name="network.macAddress" label={fa.assets.fields.macAddress} dir="ltr" touched={networkTouched.macAddress} error={networkErrors.macAddress} />
                                    <InputField name="network.networkType" label={fa.assets.fields.networkType} touched={networkTouched.networkType} error={networkErrors.networkType} />
                                    <InputField name="network.port" label={fa.assets.fields.port} touched={networkTouched.port} error={networkErrors.port} />
                                 </div>
                              </div>
                           ) : null}

                           {isSoftware ? (
                              <div>
                                 <h3 className="mb-4 text-sm font-extrabold text-brand-700 dark:text-brand-200">
                                    {fa.assets.form.softwareDetails}
                                 </h3>
                                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <InputField name="software.vendor" label={fa.assets.fields.vendor} touched={softwareTouched.vendor} error={softwareErrors.vendor} />
                                    <InputField name="software.version" label={fa.assets.fields.version} dir="ltr" touched={softwareTouched.version} error={softwareErrors.version} />
                                    <InputField name="software.edition" label={fa.assets.fields.edition} touched={softwareTouched.edition} error={softwareErrors.edition} />
                                    <InputField name="software.licenseType" label={fa.assets.fields.licenseType} touched={softwareTouched.licenseType} error={softwareErrors.licenseType} />
                                    <InputField name="software.seatCount" label={fa.assets.fields.seatCount} type="number" step="1" inputMode="numeric" touched={softwareTouched.seatCount} error={softwareErrors.seatCount} />
                                    <InputField name="software.licenseExpiry" label={fa.assets.fields.licenseExpiry} type="date" dir="ltr" touched={softwareTouched.licenseExpiry} error={softwareErrors.licenseExpiry} />
                                    <InputField name="software.installedOn" label={fa.assets.fields.installedOn} type="date" dir="ltr" touched={softwareTouched.installedOn} error={softwareErrors.installedOn} />
                                 </div>
                              </div>
                           ) : null}
                        </FormSection>
                     ) : null}

                     <FormSection title={fa.assets.form.sectionNotes}>
                        <TextareaField
                           name="notes"
                           label={fa.assets.form.notes}
                           placeholder={fa.assets.form.notesPlaceholder}
                           rows={4}
                           touched={touched.notes}
                           error={errors.notes}
                        />
                     </FormSection>

                     <div className="flex flex-wrap items-center justify-end gap-3">
                        <Link
                           href={asset ? `/admin/assets/${asset.id}` : "/admin/assets"}
                           className="rounded-full px-5 py-2.5 text-sm font-bold text-navy-600 transition-colors hover:bg-surface-muted dark:text-navy-300 dark:hover:bg-navy-800"
                        >
                           {fa.assets.form.cancel}
                        </Link>
                        <button
                           type="submit"
                           disabled={isSubmitting}
                           className="inline-flex items-center gap-2 rounded-full bg-linear-to-l from-brand-700 to-brand-800 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-700/25 transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                           <CheckIcon className="h-4 w-4" aria-hidden="true" />
                           {isSubmitting
                              ? fa.assets.form.saving
                              : mode === "create"
                                ? fa.assets.form.createAction
                                : fa.assets.form.saveAction}
                        </button>
                     </div>
                  </>
               )
            }}
         </FormShell>
      </div>
   )
}
