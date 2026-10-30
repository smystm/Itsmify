import { CONTRACT_OPTION_KINDS, type ContractOptionKind } from "./kinds"

export interface ContractOptionDto {
   id: string
   kind: ContractOptionKind
   name: string
}

export type ContractOptionsByKind = Record<ContractOptionKind, ContractOptionDto[]>

/** Group a flat API response so forms can index options by field. */
export function groupContractOptions(options: ContractOptionDto[]): ContractOptionsByKind {
   const grouped = Object.fromEntries(
      CONTRACT_OPTION_KINDS.map((kind) => [kind, [] as ContractOptionDto[]]),
   ) as ContractOptionsByKind
   for (const option of options) grouped[option.kind].push(option)
   return grouped
}
