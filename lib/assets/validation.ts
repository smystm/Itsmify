import * as yup from "yup"
import { fa } from "@/lib/i18n/fa"

/**
 * Asset form/server schema. Category is derived from type so the two fields
 * cannot drift apart; the detail objects are optional and only the one that
 * matches the selected type is persisted by the service.
 */

export const ASSET_CATEGORIES = ["HARDWARE", "SOFTWARE", "NETWORK"] as const
export const ASSET_TYPES = [
   "COMPUTER",
   "MONITOR",
   "PRINTER",
   "SCANNER",
   "COPIER",
   "PROJECTOR",
   "KEYBOARD",
   "MOUSE",
   "SPEAKER",
   "OTHER_HARDWARE",
   "SOFTWARE",
   "NETWORK_DEVICE",
] as const
export const ASSET_STATUSES = ["ACTIVE", "IN_STORAGE", "IN_REPAIR", "RETIRED", "LOST"] as const
export const ASSET_SORTS = ["newest", "oldest", "name", "code"] as const

export type AssetCategoryValue = (typeof ASSET_CATEGORIES)[number]
export type AssetTypeValue = (typeof ASSET_TYPES)[number]
export type AssetStatusValue = (typeof ASSET_STATUSES)[number]

export const CATEGORY_BY_TYPE: Record<AssetTypeValue, AssetCategoryValue> = {
   COMPUTER: "HARDWARE",
   MONITOR: "HARDWARE",
   PRINTER: "HARDWARE",
   SCANNER: "HARDWARE",
   COPIER: "HARDWARE",
   PROJECTOR: "HARDWARE",
   KEYBOARD: "HARDWARE",
   MOUSE: "HARDWARE",
   SPEAKER: "HARDWARE",
   OTHER_HARDWARE: "HARDWARE",
   SOFTWARE: "SOFTWARE",
   NETWORK_DEVICE: "NETWORK",
}

export const TYPES_BY_CATEGORY: Record<AssetCategoryValue, AssetTypeValue[]> = {
   HARDWARE: ASSET_TYPES.filter((type) => CATEGORY_BY_TYPE[type] === "HARDWARE"),
   SOFTWARE: ["SOFTWARE"],
   NETWORK: ["NETWORK_DEVICE"],
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const IPV4_RE = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/
const MAC_RE = /^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/

const optionalText = (max: number, message: string) => yup.string().trim().default("").max(max, message)

const optionalNumber = (label: string, max: number, integer = false) => {
   let schema = yup
      .number()
      .transform((value, original) =>
         original === "" || original === null || typeof original === "undefined" ? null : value,
      )
      .nullable()
      .min(0, `${label} نمی‌تواند منفی باشد`)
      .max(max, `${label} معتبر نیست`)
      .typeError(`${label} باید عدد باشد`)
   if (integer) schema = schema.integer(`${label} باید عدد صحیح باشد`)
   return schema
}

const optionalDate = (message: string) =>
   yup
      .string()
      .trim()
      .default("")
      .test("valid-date", message, (value) => {
         if (!value) return true
         if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
         return !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())
      })

const optionalId = (message: string) =>
   yup
      .string()
      .trim()
      .default("")
      .test("valid-id", message, (value) => !value || UUID_RE.test(value))

export const assetBaseSchema = yup.object({
   assetCode: yup
      .string()
      .trim()
      .default("")
      .test("asset-code", fa.assets.form.invalidAssetCode, (value) => {
         if (!value) return true
         return /^[A-Za-z0-9][A-Za-z0-9_-]{1,39}$/.test(value)
      }),
   name: yup
      .string()
      .trim()
      .default("")
      .required(fa.assets.form.requiredName)
      .min(2, "نام دارایی باید حداقل ۲ نویسه باشد")
      .max(120, "نام دارایی حداکثر ۱۲۰ نویسه است"),
   category: yup
      .string()
      .default("")
      .required(fa.assets.form.requiredCategory)
      .oneOf([...ASSET_CATEGORIES], fa.assets.form.requiredCategory),
   type: yup
      .string()
      .default("")
      .required(fa.assets.form.requiredType)
      .oneOf([...ASSET_TYPES], fa.assets.form.requiredType)
      .test("type-category", "نوع با دسته انتخاب‌شده هم‌خوان نیست", function (value) {
         const category = (this.parent as { category?: string }).category
         if (!value || !category) return true
         return CATEGORY_BY_TYPE[value as AssetTypeValue] === category
      }),
   status: yup
      .string()
      .default("ACTIVE")
      .required(fa.assets.form.requiredStatus)
      .oneOf([...ASSET_STATUSES], fa.assets.form.requiredStatus),
   brand: optionalText(100, "برند حداکثر ۱۰۰ نویسه است"),
   model: optionalText(100, "مدل حداکثر ۱۰۰ نویسه است"),
   serialNumber: optionalText(120, "شماره سریال حداکثر ۱۲۰ نویسه است"),
   orgUnitName: optionalText(100, "واحد سازمانی حداکثر ۱۰۰ نویسه است"),
   floor: optionalText(30, "طبقه حداکثر ۳۰ نویسه است"),
   roomNumber: optionalText(30, "شماره اتاق حداکثر ۳۰ نویسه است"),
   parentAssetId: optionalId("دارایی والد معتبر نیست"),
   assignedToEmployeeId: optionalId("کارمند انتخاب‌شده معتبر نیست"),
   assignNote: optionalText(500, "یادداشت واگذاری حداکثر ۵۰۰ نویسه است"),
   notes: optionalText(2000, "یادداشت حداکثر ۲۰۰۰ نویسه است"),

   computer: yup.object({
      systemType: optionalText(80, "نوع سیستم حداکثر ۸۰ نویسه است"),
      motherboardBrand: optionalText(80, "برند مادربورد حداکثر ۸۰ نویسه است"),
      motherboardModel: optionalText(80, "مدل مادربورد حداکثر ۸۰ نویسه است"),
      cpuTier: optionalText(80, "رده پردازنده حداکثر ۸۰ نویسه است"),
      cpuModel: optionalText(120, "مدل پردازنده حداکثر ۱۲۰ نویسه است"),
      ramAmountGb: optionalNumber("حافظه RAM", 4096, true),
      ramType: optionalText(60, "نوع RAM حداکثر ۶۰ نویسه است"),
      storageInfo: optionalText(200, "حافظه ذخیره‌سازی حداکثر ۲۰۰ نویسه است"),
      gpuType: optionalText(80, "نوع گرافیک حداکثر ۸۰ نویسه است"),
      gpuBrand: optionalText(80, "برند گرافیک حداکثر ۸۰ نویسه است"),
      gpuModel: optionalText(120, "مدل گرافیک حداکثر ۱۲۰ نویسه است"),
      gpuMemoryMb: optionalNumber("حافظه گرافیک", 1024 * 128, true),
      caseBrand: optionalText(80, "برند کیس حداکثر ۸۰ نویسه است"),
      caseModel: optionalText(80, "مدل کیس حداکثر ۸۰ نویسه است"),
      psuBrand: optionalText(80, "برند منبع تغذیه حداکثر ۸۰ نویسه است"),
      psuModel: optionalText(80, "مدل منبع تغذیه حداکثر ۸۰ نویسه است"),
      hasDvdWriter: yup.boolean().nullable(),
      hasSeparateSpeaker: yup.boolean().nullable(),
      speakerType: optionalText(80, "نوع بلندگو حداکثر ۸۰ نویسه است"),
      monitorInfo: optionalText(200, "اطلاعات مانیتور حداکثر ۲۰۰ نویسه است"),
      osName: optionalText(80, "سیستم‌عامل حداکثر ۸۰ نویسه است"),
      osEdition: optionalText(80, "نسخه سیستم‌عامل حداکثر ۸۰ نویسه است"),
      osVersion: optionalText(80, "ویرایش سیستم‌عامل حداکثر ۸۰ نویسه است"),
      osInstalledOn: optionalDate("تاریخ نصب سیستم‌عامل معتبر نیست"),
      osBuild: optionalText(80, "بیلد سیستم‌عامل حداکثر ۸۰ نویسه است"),
      officeVersion: optionalText(80, "نسخه Office حداکثر ۸۰ نویسه است"),
      systemUsername: optionalText(120, "نام کاربری سیستم حداکثر ۱۲۰ نویسه است"),
      automationUsername: optionalText(120, "نام کاربری اتوماسیون حداکثر ۱۲۰ نویسه است"),
   }).noUnknown(true),

   monitor: yup.object({
      sizeInches: optionalNumber("اندازه مانیتور", 200),
      panelType: optionalText(80, "نوع پنل حداکثر ۸۰ نویسه است"),
      resolution: optionalText(80, "رزولوشن حداکثر ۸۰ نویسه است"),
   }).noUnknown(true),

   peripheral: yup.object({
      connectionType: optionalText(80, "نوع اتصال حداکثر ۸۰ نویسه است"),
      printerType: optionalText(80, "نوع چاپگر حداکثر ۸۰ نویسه است"),
      cartridgeModel: optionalText(120, "مدل کارتریج حداکثر ۱۲۰ نویسه است"),
      speakerType: optionalText(80, "نوع بلندگو حداکثر ۸۰ نویسه است"),
   }).noUnknown(true),

   network: yup.object({
      ipAddress: optionalText(45, "نشانی IP حداکثر ۴۵ نویسه است").test(
         "ip-address",
         fa.assets.form.invalidIp,
         (value) => !value || IPV4_RE.test(value) || (value.includes(":") && /^[0-9a-fA-F:]+$/.test(value)),
      ),
      netboxTitle: optionalText(120, "عنوان NetBox حداکثر ۱۲۰ نویسه است"),
      hostname: optionalText(120, "نام میزبان حداکثر ۱۲۰ نویسه است"),
      macAddress: optionalText(32, "نشانی MAC حداکثر ۳۲ نویسه است").test(
         "mac-address",
         fa.assets.form.invalidMac,
         (value) => !value || MAC_RE.test(value),
      ),
      networkType: optionalText(80, "نوع شبکه حداکثر ۸۰ نویسه است"),
      port: optionalText(40, "پورت حداکثر ۴۰ نویسه است"),
   }).noUnknown(true),

   software: yup.object({
      vendor: optionalText(100, "سازنده حداکثر ۱۰۰ نویسه است"),
      version: optionalText(80, "نسخه حداکثر ۸۰ نویسه است"),
      edition: optionalText(80, "ویرایش حداکثر ۸۰ نویسه است"),
      licenseType: optionalText(80, "نوع لایسنس حداکثر ۸۰ نویسه است"),
      seatCount: optionalNumber("تعداد کاربر", 1_000_000, true),
      licenseExpiry: optionalDate("تاریخ انقضای لایسنس معتبر نیست"),
      installedOn: optionalDate("تاریخ نصب معتبر نیست"),
   }).noUnknown(true),
})

export const createAssetSchema = assetBaseSchema
export const updateAssetSchema = assetBaseSchema.omit(["assignedToEmployeeId", "assignNote"])

export const assignAssetSchema = yup.object({
   employeeId: yup
      .string()
      .trim()
      .default("")
      .required(fa.assets.assign.invalidEmployee)
      .matches(UUID_RE, fa.assets.assign.invalidEmployee),
   note: optionalText(500, "یادداشت واگذاری حداکثر ۵۰۰ نویسه است"),
})

export const returnAssetSchema = yup.object({
   note: optionalText(500, "یادداشت بازگشت حداکثر ۵۰۰ نویسه است"),
})

export type CreateAssetInput = yup.InferType<typeof createAssetSchema>
export type UpdateAssetInput = yup.InferType<typeof updateAssetSchema>
export type AssignAssetInput = yup.InferType<typeof assignAssetSchema>
export type ReturnAssetInput = yup.InferType<typeof returnAssetSchema>
