import "server-only"

/**
 * Server-only doorway to the password primitives. Keeping `server-only` here
 * (rather than in password-core.ts) lets the Prisma bootstrap script reuse the
 * same hashing code outside the Next.js runtime without weakening the module
 * boundary for application code.
 */
export {
   DUMMY_PASSWORD_HASH,
   PASSWORD_MAX,
   PASSWORD_MIN,
   generateTemporaryPassword,
   hashPassword,
   verifyPassword,
} from "./password-core"
