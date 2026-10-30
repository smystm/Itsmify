/** Every asset field backed by an admin-managed contract list. */
export const CONTRACT_OPTION_KINDS = [
   "BRAND",
   "SYSTEM_TYPE",
   "MOTHERBOARD_BRAND",
   "CPU_TIER",
   "RAM_TYPE",
   "GPU_TYPE",
   "GPU_BRAND",
   "CASE_BRAND",
   "PSU_BRAND",
   "SPEAKER_TYPE",
   "OS_NAME",
   "OS_EDITION",
   "OFFICE_VERSION",
   "PANEL_TYPE",
   "RESOLUTION",
   "CONNECTION_TYPE",
   "PRINTER_TYPE",
   "NETWORK_TYPE",
   "SOFTWARE_VENDOR",
   "LICENSE_TYPE",
   "SOFTWARE_EDITION",
] as const

export type ContractOptionKind = (typeof CONTRACT_OPTION_KINDS)[number]

export const CONTRACT_GROUPS = [
   { id: "identity", kinds: ["BRAND"] },
   {
      id: "computer",
      kinds: [
         "SYSTEM_TYPE",
         "MOTHERBOARD_BRAND",
         "CPU_TIER",
         "RAM_TYPE",
         "GPU_TYPE",
         "GPU_BRAND",
         "CASE_BRAND",
         "PSU_BRAND",
      ],
   },
   {
      id: "software",
      kinds: [
         "OS_NAME",
         "OS_EDITION",
         "OFFICE_VERSION",
         "SOFTWARE_VENDOR",
         "SOFTWARE_EDITION",
         "LICENSE_TYPE",
      ],
   },
   { id: "monitor", kinds: ["PANEL_TYPE", "RESOLUTION"] },
   { id: "peripheral", kinds: ["SPEAKER_TYPE", "CONNECTION_TYPE", "PRINTER_TYPE"] },
   { id: "network", kinds: ["NETWORK_TYPE"] },
] as const satisfies readonly { id: string; kinds: readonly ContractOptionKind[] }[]

export type ContractGroupId = (typeof CONTRACT_GROUPS)[number]["id"]

export function isContractOptionKind(value: unknown): value is ContractOptionKind {
   return typeof value === "string" && (CONTRACT_OPTION_KINDS as readonly string[]).includes(value)
}
