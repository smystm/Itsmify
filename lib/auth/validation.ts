import * as yup from "yup"
import { isValidPhone, normalizePhone } from "./phone"
import { isRole } from "./permissions"
import { PASSWORD_MAX, PASSWORD_MIN } from "./password"

/**
 * Server-side validation. The client's yup schemas sit in the components for
 * immediate feedback; these are the only ones that gate a database write —
 * submitted JSON is untrusted, whatever the DOM did or did not check.
 *
 * Every message is the user-facing Persian text, so a route handler failing
 * validation can pass the field map straight into its response for the UI to
 * place under the right inputs.
 */

/* ---------------------------------------------------------------- */
/* Phone — normalized first, then canonical regex (reference rules). */
/* ---------------------------------------------------------------- */

export const phoneField = () =>
   yup
      .string()
      .default("")
      .required("شماره موبایل را وارد کنید")
      .test("phone-valid", "شماره موبایل نامعتبر است", (value) => isValidPhone(value ?? ""))

/** Phone is optional profile data on admin forms; empty means "not set". */
export const optionalPhoneField = () =>
   yup
      .string()
      .default("")
      .trim()
      .test("phone-valid", "شماره موبایل نامعتبر است", (value) => !value || isValidPhone(value))

export function normalizedPhone(input: string): string {
   return normalizePhone(input)
}

/* ---------------------------------------------------------------- */
/* Names                                                            */
/* ---------------------------------------------------------------- */

const NAME_MIN = 2
const NAME_MAX = 40

export const firstNameField = () =>
   yup
      .string()
      .default("")
      .trim()
      .required("نام را وارد کنید")
      .min(NAME_MIN, `نام باید حداقل ${NAME_MIN} نویسه باشد`)
      .max(NAME_MAX, `نام باید حداکثر ${NAME_MAX} نویسه باشد`)

export const lastNameField = () =>
   yup
      .string()
      .default("")
      .trim()
      .required("نام خانوادگی را وارد کنید")
      .min(NAME_MIN, `نام خانوادگی باید حداقل ${NAME_MIN} نویسه باشد`)
      .max(NAME_MAX, `نام خانوادگی باید حداکثر ${NAME_MAX} نویسه باشد`)

/* ---------------------------------------------------------------- */
/* Username — ASCII handle, unique and lowercase by construction.    */
/* ---------------------------------------------------------------- */

export const USERNAME_MIN = 3
export const USERNAME_MAX = 32

export const usernameField = () =>
   yup
      .string()
      .default("")
      .trim()
      .required("نام کاربری را وارد کنید")
      .min(USERNAME_MIN, `نام کاربری باید حداقل ${USERNAME_MIN} نویسه باشد`)
      .max(USERNAME_MAX, `نام کاربری باید حداکثر ${USERNAME_MAX} نویسه باشد`)
      .matches(
         /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/,
         "نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد، نقطه، خط تیره و زیرخط باشد",
      )
      .transform((value) => (typeof value === "string" ? value.toLowerCase() : value))

/* ---------------------------------------------------------------- */
/* Password                                                          */
/* ---------------------------------------------------------------- */

const PASSWORD_POLICY_MESSAGE = `رمز عبور باید حداقل ${PASSWORD_MIN} نویسه و شامل حرف و رقم باشد`

export function isStrongPassword(value: string): boolean {
   return (
      value.length >= PASSWORD_MIN &&
      value.length <= PASSWORD_MAX &&
      /[A-Za-z]/.test(value) &&
      /[0-9]/.test(value)
   )
}

/** New passwords (self change, admin create/reset). */
export const passwordField = () =>
   yup
      .string()
      .default("")
      .required("رمز عبور را وارد کنید")
      .max(PASSWORD_MAX, `رمز عبور باید حداکثر ${PASSWORD_MAX} نویسه باشد`)
      .test("password-policy", PASSWORD_POLICY_MESSAGE, (value) => isStrongPassword(value ?? ""))

/** Optional password on admin-create: empty means "generate one". */
export const optionalPasswordField = () =>
   yup
      .string()
      .default("")
      .max(PASSWORD_MAX, `رمز عبور باید حداکثر ${PASSWORD_MAX} نویسه باشد`)
      .test("password-policy", PASSWORD_POLICY_MESSAGE, (value) => !value || isStrongPassword(value))

/** Existing password typed by its owner — policy belongs on the new one only. */
export const currentPasswordField = () =>
   yup.string().default("").required("رمز عبور فعلی را وارد کنید").max(PASSWORD_MAX)

/* ---------------------------------------------------------------- */
/* Roles & statuses                                                  */
/* ---------------------------------------------------------------- */

export const roleField = () =>
   yup
      .string()
      .default("EMPLOYEE")
      .required("نقش مشخص نشده است")
      .test("valid-role", "نقش نامعتبر است", (value) => isRole(value))

export const ACCOUNT_STATUSES = ["ACTIVE", "SUSPENDED"] as const
export type AccountStatusValue = (typeof ACCOUNT_STATUSES)[number]

export function isAccountStatus(value: unknown): value is AccountStatusValue {
   return typeof value === "string" && (ACCOUNT_STATUSES as readonly string[]).includes(value)
}

export const statusField = () =>
   yup
      .string()
      .default("ACTIVE")
      .required("وضعیت حساب مشخص نشده است")
      .oneOf([...ACCOUNT_STATUSES], "وضعیت حساب نامعتبر است")

/* ---------------------------------------------------------------- */
/* OTP (phone-change flow)                                           */
/* ---------------------------------------------------------------- */

export const challengeIdField = () =>
   yup.string().default("").required("شناسه چالش یافت نشد").trim()

export const codeField = () =>
   yup
      .string()
      .default("")
      .required("کد تایید را وارد کنید")
      .matches(/^\d{6}$/, "کد باید ۶ رقم باشد")

/* ---------------------------------------------------------------- */
/* Endpoint schemas                                                  */
/* ---------------------------------------------------------------- */

export const loginSchema = yup.object({
   username: usernameField(),
   password: yup.string().default("").required("رمز عبور را وارد کنید").max(PASSWORD_MAX),
})

export const createUserSchema = yup.object({
   firstName: firstNameField(),
   lastName: lastNameField(),
   username: usernameField(),
   phone: optionalPhoneField(),
   role: roleField(),
   status: statusField(),
   password: optionalPasswordField(),
})

export const updateUserSchema = yup.object({
   firstName: firstNameField(),
   lastName: lastNameField(),
   username: usernameField(),
   phone: optionalPhoneField(),
   role: roleField(),
   status: statusField(),
})

export const passwordChangeSchema = yup.object({
   currentPassword: currentPasswordField(),
   newPassword: passwordField(),
})

export const phoneChangeRequestSchema = yup.object({
   phone: phoneField(),
})

export const phoneChangeVerifySchema = yup.object({
   challengeId: challengeIdField(),
   code: codeField(),
})

/**
 * Runs a schema and flattens failures into `{ field: message }`.
 * The returned map doubles as the API's 422 body and the form's errors.
 */
export async function validate<T extends yup.Maybe<yup.AnyObject>>(
   schema: yup.ObjectSchema<T>,
   payload: unknown,
): Promise<{ ok: true; value: T } | { ok: false; errors: Record<string, string> }> {
   try {
      const value = await schema.validate(payload, { abortEarly: false, stripUnknown: true })
      // The schema enforces every key of T, so a payload that survives
      // validation satisfies it at runtime; yup's type keeps them optional.
      return { ok: true, value: value as T }
   } catch (err) {
      if (err instanceof yup.ValidationError) {
         const errors: Record<string, string> = {}
         for (const issue of err.inner.length ? err.inner : [err]) {
            const key = String(issue.path ?? "form")
            if (!errors[key]) errors[key] = issue.message
         }
         return { ok: false, errors }
      }
      throw err
   }
}
