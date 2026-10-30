import * as yup from "yup"
import { fa } from "@/lib/i18n/fa"
import { CONTRACT_OPTION_KINDS } from "./kinds"

export const CONTRACT_OPTION_NAME_MAX = 100

/** Canonical display form: trimmed and with repeated whitespace collapsed. */
export function normalizeContractOptionName(value: string): string {
   return value.trim().replace(/\s+/g, " ")
}

/** Case-insensitive identity used by the unique index and lookups. */
export function contractOptionNameKey(value: string): string {
   return normalizeContractOptionName(value).toLowerCase()
}

const nameField = () =>
   yup
      .string()
      .default("")
      .transform((value) => (typeof value === "string" ? normalizeContractOptionName(value) : value))
      .required(fa.contractBuilder.nameRequired)
      .max(CONTRACT_OPTION_NAME_MAX, fa.contractBuilder.nameMax)

export const createContractOptionSchema = yup.object({
   kind: yup
      .string()
      .default("")
      .required(fa.contractBuilder.invalidKind)
      .oneOf([...CONTRACT_OPTION_KINDS], fa.contractBuilder.invalidKind),
   name: nameField(),
})

export const updateContractOptionSchema = yup.object({
   name: nameField(),
})

export type CreateContractOptionInput = yup.InferType<typeof createContractOptionSchema>
export type UpdateContractOptionInput = yup.InferType<typeof updateContractOptionSchema>
