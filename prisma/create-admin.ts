import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { isValidPhone, normalizePhone } from "../lib/auth/phone"
import {
   PASSWORD_MAX,
   PASSWORD_MIN,
   generateTemporaryPassword,
   hashPassword,
} from "../lib/auth/password-core"

/**
 * Boots or repairs the first SYS_ADMIN.
 *
 * Accounts are provisioned by administrators now, so a fresh install has a
 * chicken-and-egg problem: nobody can create the first administrator. This
 * script is the key — run it once after migrations:
 *
 *   npm run db:admin -- --first-name "Hesam" --last-name "Admin" \
 *     --username "admin" --phone "09121234567"
 *
 * With no `--password` (or ADMIN_PASSWORD) it generates a strong temporary
 * password and prints it exactly once. A supplied password is never echoed.
 * Either way the account is marked `mustChangePassword`, so the first sign-in
 * is forced through /change-password.
 *
 * Re-running updates the same username: password, role and ACTIVE status are
 * restored, sessions are revoked, and an optional phone is refreshed. It never
 * creates a duplicate account.
 */

const prisma = new PrismaClient()

function arg(name: string): string | undefined {
   const idx = process.argv.indexOf(`--${name}`)
   return idx >= 0 ? process.argv[idx + 1] : undefined
}

function policyOk(password: string): boolean {
   return (
      password.length >= PASSWORD_MIN &&
      password.length <= PASSWORD_MAX &&
      /[A-Za-z]/.test(password) &&
      /[0-9]/.test(password)
   )
}

async function main() {
   const firstName = arg("first-name") ?? process.env.ADMIN_FIRST_NAME
   const lastName = arg("last-name") ?? process.env.ADMIN_LAST_NAME
   const username = (arg("username") ?? process.env.ADMIN_USERNAME)?.toLowerCase()
   const phoneRaw = arg("phone") ?? process.env.ADMIN_PHONE
   const suppliedPassword = arg("password") ?? process.env.ADMIN_PASSWORD

   if (!firstName || !lastName || !username) {
      console.error(
         [
            "Usage:",
            '  npm run db:admin -- --first-name "<name>" --last-name "<family>" --username "<handle>" [--phone "09xxxxxxxxx"] [--password "<secret>"]',
            "",
            "Omit --password to generate one (printed once).",
         ].join("\n"),
      )
      process.exit(1)
   }

   const phone = phoneRaw ? normalizePhone(phoneRaw) : undefined
   if (phone && !isValidPhone(phone)) {
      console.error("Phone is not a valid Iranian mobile number (must normalize to 09xxxxxxxxx).")
      process.exit(1)
   }

   const generated = !suppliedPassword
   const password = suppliedPassword ?? generateTemporaryPassword(16)
   if (!policyOk(password)) {
      console.error(`Password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters and contain a letter and a digit.`)
      process.exit(1)
   }

   const passwordHash = await hashPassword(password)

   const user = await prisma.user.upsert({
      where: { username },
      update: {
         firstName,
         lastName,
         passwordHash,
         mustChangePassword: true,
         passwordChangedAt: null,
         role: "SYS_ADMIN",
         status: "ACTIVE",
         deletedAt: null,
         deletedById: null,
         ...(phone ? { phone, phoneVerifiedAt: new Date() } : {}),
      },
      create: {
         firstName,
         lastName,
         username,
         phone: phone ?? null,
         phoneVerifiedAt: phone ? new Date() : null,
         passwordHash,
         mustChangePassword: true,
         role: "SYS_ADMIN",
         status: "ACTIVE",
      },
      select: { id: true, username: true, phone: true },
   })

   // A bootstrap admin might hold sessions from a previous credential — drop
   // them so the next sign-in starts from the new password.
   await prisma.session.deleteMany({ where: { userId: user.id } })

   if (generated) {
      console.log("Generated initial password (shown once — change it at first sign-in):")
      console.log(`  ${password}`)
   }

   console.log("SYS_ADMIN ready:", {
      username: user.username,
      phone: user.phone ?? "(not set)",
      mustChangePassword: true,
   })
}

main()
   .catch((err) => {
      // Unique conflict on phone is the realistic failure; a helpful line beats
      // a Prisma stack dump.
      if (err && typeof err === "object" && (err as { code?: string }).code === "P2002") {
         console.error("That phone number is already attached to another account. Choose a different one.")
      } else {
         console.error(err)
      }
      process.exit(1)
   })
   .finally(() => prisma.$disconnect())
