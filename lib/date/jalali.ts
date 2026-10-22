/**
 * Persian (Jalali) display helpers.
 *
 * The database and every HTML date input stay Gregorian/ISO so server
 * validation is unambiguous. Presentation is explicitly pinned to the Persian
 * calendar instead of relying on a browser's default calendar for `fa-IR`.
 */
const dateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
   year: "numeric",
   month: "long",
   day: "numeric",
})

const dateTimeFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
   year: "numeric",
   month: "long",
   day: "numeric",
   hour: "2-digit",
   minute: "2-digit",
})

function asDate(value: string | Date | null | undefined): Date | null {
   if (!value) return null
   const date = value instanceof Date ? value : new Date(value)
   return Number.isNaN(date.getTime()) ? null : date
}

export function formatJalaliDate(value: string | Date | null | undefined): string {
   const date = asDate(value)
   return date ? dateFormatter.format(date) : "—"
}

export function formatJalaliDateTime(value: string | Date | null | undefined): string {
   const date = asDate(value)
   return date ? dateTimeFormatter.format(date) : "—"
}
