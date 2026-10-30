/**
 * Where each contract list is used inside the asset tables. Table and column
 * names are developer constants, never user input, so they are safe to quote
 * into SQL. Detail tables join assets to exclude soft-deleted rows from usage
 * counts.
 */
import type { ContractOptionKind } from "./kinds"

export interface ContractTarget {
   table: "assets" | "computer_details" | "monitor_details" | "peripheral_details" | "network_details" | "software_details"
   column: string
   joinAsset: boolean
}

export const CONTRACT_TARGETS: Record<ContractOptionKind, readonly ContractTarget[]> = {
   BRAND: [{ table: "assets", column: "brand", joinAsset: false }],
   SYSTEM_TYPE: [{ table: "computer_details", column: "systemType", joinAsset: true }],
   MOTHERBOARD_BRAND: [{ table: "computer_details", column: "motherboardBrand", joinAsset: true }],
   CPU_TIER: [{ table: "computer_details", column: "cpuTier", joinAsset: true }],
   RAM_TYPE: [{ table: "computer_details", column: "ramType", joinAsset: true }],
   GPU_TYPE: [{ table: "computer_details", column: "gpuType", joinAsset: true }],
   GPU_BRAND: [{ table: "computer_details", column: "gpuBrand", joinAsset: true }],
   CASE_BRAND: [{ table: "computer_details", column: "caseBrand", joinAsset: true }],
   PSU_BRAND: [{ table: "computer_details", column: "psuBrand", joinAsset: true }],
   SPEAKER_TYPE: [
      { table: "computer_details", column: "speakerType", joinAsset: true },
      { table: "peripheral_details", column: "speakerType", joinAsset: true },
   ],
   OS_NAME: [{ table: "computer_details", column: "osName", joinAsset: true }],
   OS_EDITION: [{ table: "computer_details", column: "osEdition", joinAsset: true }],
   OFFICE_VERSION: [{ table: "computer_details", column: "officeVersion", joinAsset: true }],
   PANEL_TYPE: [{ table: "monitor_details", column: "panelType", joinAsset: true }],
   RESOLUTION: [{ table: "monitor_details", column: "resolution", joinAsset: true }],
   CONNECTION_TYPE: [{ table: "peripheral_details", column: "connectionType", joinAsset: true }],
   PRINTER_TYPE: [{ table: "peripheral_details", column: "printerType", joinAsset: true }],
   NETWORK_TYPE: [{ table: "network_details", column: "networkType", joinAsset: true }],
   SOFTWARE_VENDOR: [{ table: "software_details", column: "vendor", joinAsset: true }],
   LICENSE_TYPE: [{ table: "software_details", column: "licenseType", joinAsset: true }],
   SOFTWARE_EDITION: [{ table: "software_details", column: "edition", joinAsset: true }],
}
