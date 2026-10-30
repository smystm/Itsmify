/**
 * Persian (Jalali) display helpers.
 *
 * The database and form values stay Gregorian/ISO so server validation is
 * unambiguous. Presentation is explicitly pinned to the Persian calendar
 * instead of relying on a browser's default calendar for `fa-IR`.
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

/*
 * Calendar arithmetic for the date picker. Pure integer math, so a date never
 * shifts when the browser timezone differs from the stored UTC date.
 */
const JALALI_BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178]
// shortcut: typed input accepts Jalali 1200-1600 so a Gregorian-looking year
// is rejected; widen the range if the product ever needs dates outside it.
const MIN_INPUT_YEAR = 1200
const MAX_INPUT_YEAR = 1600

interface JalaliParts {
   jy: number
   jm: number
   jd: number
}

interface GregorianParts {
   gy: number
   gm: number
   gd: number
}

function div(a: number, b: number): number {
   return ~~(a / b)
}

function mod(a: number, b: number): number {
   return a - ~~(a / b) * b
}

const pad = (value: number) => String(value).padStart(2, "0")

function jalCal(jy: number, withoutLeap = false): { leap?: number; gy: number; march: number } {
   const bl = JALALI_BREAKS.length
   const gy = jy + 621
   let leapJ = -14
   let jp = JALALI_BREAKS[0]
   let jump = 0

   for (let i = 1; i < bl; i += 1) {
      const jm = JALALI_BREAKS[i]
      jump = jm - jp
      if (jy < jm) break
      leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4)
      jp = jm
   }

   let n = jy - jp
   leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
   if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1

   const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
   const march = 20 + leapJ - leapG

   if (withoutLeap) return { gy, march }

   if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
   let leap = mod(mod(n + 1, 33) - 1, 4)
   if (leap === -1) leap = 4

   return { leap, gy, march }
}

function g2d(gy: number, gm: number, gd: number): number {
   let day = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408
   day = day - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
   return day
}

function d2g(jdn: number): GregorianParts {
   let j = 4 * jdn + 139361631
   j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908
   const i = div(mod(j, 1461), 4) * 5 + 308
   const gd = div(mod(i, 153), 5) + 1
   const gm = mod(div(i, 153), 12) + 1
   const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
   return { gy, gm, gd }
}

function j2d(jy: number, jm: number, jd: number): number {
   const r = jalCal(jy, true)
   return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
}

function d2j(jdn: number): JalaliParts {
   const gy = d2g(jdn).gy
   let jy = gy - 621
   const r = jalCal(jy)
   const jdn1f = g2d(gy, 3, r.march)
   let k = jdn - jdn1f

   if (k >= 0) {
      if (k <= 185) return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 }
      k -= 186
   } else {
      jy -= 1
      k += 179
      if (r.leap === 1) k += 1
   }

   return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 }
}

export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliParts {
   return d2j(g2d(gy, gm, gd))
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): GregorianParts {
   return d2g(j2d(jy, jm, jd))
}

export function jalaliMonthLength(jy: number, jm: number): number {
   if (jm <= 6) return 31
   if (jm <= 11) return 30
   return jalCal(jy).leap === 0 ? 30 : 29
}

export function jalaliToIso(jy: number, jm: number, jd: number): string {
   const g = jalaliToGregorian(jy, jm, jd)
   return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`
}

export function isoToJalali(value: string | null | undefined): JalaliParts | null {
   if (!value) return null
   const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.slice(0, 10))
   if (!match) return null

   const gy = Number(match[1])
   const gm = Number(match[2])
   const gd = Number(match[3])
   if (gy < 622 || gy > 3798 || gm < 1 || gm > 12 || gd < 1 || gd > 31) return null

   return gregorianToJalali(gy, gm, gd)
}

function normalizeDigits(value: string): string {
   return value
      .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
      .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
}

export function parseJalaliInput(text: string): string | null {
   const normalized = normalizeDigits(text.trim()).replace(/[.-]/g, "/")
   const match = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(normalized)
   if (!match) return null

   const jy = Number(match[1])
   const jm = Number(match[2])
   const jd = Number(match[3])
   if (jy < MIN_INPUT_YEAR || jy > MAX_INPUT_YEAR) return null
   if (jm < 1 || jm > 12 || jd < 1 || jd > jalaliMonthLength(jy, jm)) return null

   return jalaliToIso(jy, jm, jd)
}

export function toPersianDigits(value: string | number): string {
   return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)])
}

export function formatJalaliInput(value: string | null | undefined): string {
   const date = isoToJalali(value)
   return date ? toPersianDigits(`${date.jy}/${pad(date.jm)}/${pad(date.jd)}`) : ""
}

export function todayIso(): string {
   const now = new Date()
   return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
