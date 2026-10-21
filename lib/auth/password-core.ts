import crypto from "node:crypto"

/**
 * Password hashing primitives, dependency-free so both the Next.js runtime
 * (through lib/auth/password.ts) and the Prisma bootstrap script can use the
 * exact same algorithm.
 *
 * scrypt is memory-hard, ships with Node (no native addon to compile), and
 * supports per-password salts. The encoded string carries the parameters so a
 * future cost bump can verify old hashes and transparently upgrade them.
 *
 * Plaintext passwords never leave this module: callers hash on write, and only
 * `verifyPassword` compares on read. Nothing in the app can decrypt a stored
 * password back to text.
 */

const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LENGTH = 64
const SALT_LENGTH = 16
const MAX_MEM = 64 * 1024 * 1024

export const PASSWORD_MIN = 10
export const PASSWORD_MAX = 128

/** A real scrypt hash of a random throwaway value. Unknown usernames are
 *  verified against this so response timing does not reveal whether a username
 *  exists. It can never match a user-supplied password. */
export const DUMMY_PASSWORD_HASH =
   "scrypt$16384$8$1$yEpJF2-iUB6sV_uJIWu-Hw$-rQ5lupWpGJmsWQe4JDoYBNyRkiv2eAj5sPcYJHT0KwIyoneIxa5S53WyGpFHhhxEC9ObHUOP-uP8ASCLzTMrg"

function derive(
   password: string,
   salt: Buffer,
   keyLength: number,
   params: { N: number; r: number; p: number },
): Promise<Buffer> {
   return new Promise((resolve, reject) => {
      crypto.scrypt(
         // NFKC keeps visually identical passwords (e.g. Arabic vs Persian
         // digits) consistent without accepting surprising byte sequences.
         password.normalize("NFKC"),
         salt,
         keyLength,
         { N: params.N, r: params.r, p: params.p, maxmem: MAX_MEM },
         (err, key) => (err ? reject(err) : resolve(key)),
      )
   })
}

export async function hashPassword(password: string): Promise<string> {
   const salt = crypto.randomBytes(SALT_LENGTH)
   const key = await derive(password, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P })
   return ["scrypt", SCRYPT_N, SCRYPT_R, SCRYPT_P, salt.toString("base64url"), key.toString("base64url")].join("$")
}

/**
 * Constant-time comparison against an encoded hash. Returns false for
 * malformed records instead of throwing, so a corrupted row cannot take the
 * login endpoint down.
 */
export async function verifyPassword(password: string, encoded: string | null | undefined): Promise<boolean> {
   if (!encoded) return false

   const parts = encoded.split("$")
   if (parts.length !== 6 || parts[0] !== "scrypt") return false

   const N = Number(parts[1])
   const r = Number(parts[2])
   const p = Number(parts[3])
   if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false
   // Bounds keep a hostile/corrupt row from asking for gigabytes of memory.
   if (N < 1024 || N > 1 << 20 || r < 1 || r > 16 || p < 1 || p > 4) return false

   const salt = Buffer.from(parts[4], "base64url")
   const expected = Buffer.from(parts[5], "base64url")
   if (salt.length < 8 || expected.length < 16) return false

   try {
      const actual = await derive(password, salt, expected.length, { N, r, p })
      return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
   } catch {
      return false
   }
}

/**
 * Strong temporary password shown to an administrator exactly once. Uses an
 * unambiguous alphabet (no 0/O/1/l/I) and guarantees at least one letter and
 * one digit, matching the policy enforced by validation.
 */
export function generateTemporaryPassword(length = 14): string {
   const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
   const digits = "23456789"
   const alphabet = letters + digits + "!@#$%^&*"
   const chars = [letters[crypto.randomInt(letters.length)], digits[crypto.randomInt(digits.length)]]
   while (chars.length < Math.max(length, 10)) {
      chars.push(alphabet[crypto.randomInt(alphabet.length)])
   }
   // Fisher–Yates so the guaranteed characters are not always at the start.
   for (let i = chars.length - 1; i > 0; i -= 1) {
      const j = crypto.randomInt(i + 1)
      ;[chars[i], chars[j]] = [chars[j], chars[i]]
   }
   return chars.join("")
}
