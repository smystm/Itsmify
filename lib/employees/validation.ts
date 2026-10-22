import * as yup from "yup"
import { isValidPhone } from "@/lib/auth/phone"
import { isRole } from "@/lib/auth/permissions"
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/auth/password-core"

/**
 * Employee form/server schema. It is deliberately shared between the client
 * form and the route handler: the messages are Persian, the same rules run on
 * both sides, and profile fields are optional because the Excel reference does
 * not contain HR data.
 */

export const EMPLOYMENT_TYPES = ["OFFICIAL", "CONTRACTUAL", "TEMPORARY", "OTHER"] as const
export type EmploymentTypeValue = (typeof EMPLOYMENT_TYPES)[number]

const NAME_MIN = 2
const NAME_MAX = 40
const USERNAME_MIN = 3
const USERNAME_MAX = 32

const PASSWORD_POLICY_MESSAGE = `رمز عبور باید حداقل ${PASSWORD_MIN} نویسه و شامل حرف و رقم باشد`
const strongPassword = /^(?=.*[A-Za-z])(?=.*[0-9]).{10,128}$/

function normalizeDigits(value: string): string {
   return value
      .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
      .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
}

const optionalText = (max: number, message: string) =>
   yup.string().trim().default("").max(max, message)

export const createEmployeeSchema = yup.object({
   firstName: yup
      .string()
      .trim()
      .default("")
      .required("نام را وارد کنید")
      .min(NAME_MIN, `نام باید حداقل ${NAME_MIN} نویسه باشد`)
      .max(NAME_MAX, `نام باید حداکثر ${NAME_MAX} نویسه باشد`),
   lastName: yup
      .string()
      .trim()
      .default("")
      .required("نام خانوادگی را وارد کنید")
      .min(NAME_MIN, `نام خانوادگی باید حداقل ${NAME_MIN} نویسه باشد`)
      .max(NAME_MAX, `نام خانوادگی باید حداکثر ${NAME_MAX} نویسه باشد`),
   username: yup
      .string()
      .trim()
      .default("")
      .required("نام کاربری را وارد کنید")
      .min(USERNAME_MIN, `نام کاربری باید حداقل ${USERNAME_MIN} نویسه باشد`)
      .max(USERNAME_MAX, `نام کاربری باید حداکثر ${USERNAME_MAX} نویسه باشد`)
      .matches(
         /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
         "نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد، نقطه، خط تیره و زیرخط باشد",
      )
      .transform((value) => (typeof value === "string" ? value.toLowerCase() : value)),
   phone: yup
      .string()
      .trim()
      .default("")
      .test("phone-valid", "شماره موبایل نامعتبر است", (value) => !value || isValidPhone(value)),
   role: yup
      .string()
      .default("EMPLOYEE")
      .required("نقش مشخص نشده است")
      .test("valid-role", "نقش نامعتبر است", (value) => isRole(value)),
   status: yup
      .string()
      .default("ACTIVE")
      .required("وضعیت حساب مشخص نشده است")
      .oneOf(["ACTIVE", "SUSPENDED"], "وضعیت حساب نامعتبر است"),
   password: yup
      .string()
      .default("")
      .max(PASSWORD_MAX, `رمز عبور باید حداکثر ${PASSWORD_MAX} نویسه باشد`)
      .test("password-policy", PASSWORD_POLICY_MESSAGE, (value) => !value || strongPassword.test(value)),

   personnelCode: optionalText(32, "کد پرسنلی حداکثر ۳۲ نویسه است").matches(
      /^[0-9A-Za-z_-]*$/,
      "کد پرسنلی فقط می‌تواند شامل حروف انگلیسی، اعداد، خط تیره و زیرخط باشد",
   ),
   nationalId: yup
      .string()
      .trim()
      .default("")
      .transform((value) => (typeof value === "string" ? normalizeDigits(value) : value))
      .matches(/^\d{0,10}$/, "کد ملی باید ۱۰ رقم باشد")
      .test("national-id-length", "کد ملی باید ۱۰ رقم باشد", (value) => !value || value.length === 10),
   jobTitle: optionalText(100, "عنوان شغلی حداکثر ۱۰۰ نویسه است"),
   orgUnitName: optionalText(100, "واحد سازمانی حداکثر ۱۰۰ نویسه است"),
   floor: optionalText(30, "طبقه حداکثر ۳۰ نویسه است"),
   roomNumber: optionalText(30, "شماره اتاق حداکثر ۳۰ نویسه است"),
   employmentType: yup
      .string()
      .default("")
      .oneOf(["", ...EMPLOYMENT_TYPES], "نوع استخدام نامعتبر است"),
   hireDate: yup
      .string()
      .trim()
      .default("")
      .test("hire-date", "تاریخ استخدام معتبر نیست", (value) => {
         if (!value) return true
         if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
         return !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())
      }),
   notes: optionalText(1000, "یادداشت حداکثر ۱۰۰۰ نویسه است"),
})

export const updateEmployeeSchema = createEmployeeSchema.omit(["password"])

export const employeeStatusSchema = yup.object({
   status: yup
      .string()
      .default("")
      .required("وضعیت حساب مشخص نشده است")
      .oneOf(["ACTIVE", "SUSPENDED"], "وضعیت حساب نامعتبر است"),
})

export type CreateEmployeeInput = yup.InferType<typeof createEmployeeSchema>
export type UpdateEmployeeInput = yup.InferType<typeof updateEmployeeSchema>
export type EmployeeStatusInput = yup.InferType<typeof employeeStatusSchema>

export const EMPLOYEE_SORTS = ["newest", "oldest", "name", "lastLogin"] as const
export type EmployeeSort = (typeof EMPLOYEE_SORTS)[number]

export const EMPLOYEE_PAGE_SIZES = [10, 20, 50] as const
