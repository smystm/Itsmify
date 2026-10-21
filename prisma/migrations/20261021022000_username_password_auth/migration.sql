-- ITSMIFY — username/password authentication.
--
-- Data policy for this migration:
--   * Existing APPROVED accounts become ACTIVE; PENDING/REJECTED become SUSPENDED.
--   * Pending OTP challenges are discarded with the registration/login flows.
--   * All sessions are revoked: the new credential is a password, and every
--     account must sign in again (the first admin is bootstrapped afterwards).
--   * The former self-registration fixture accounts are removed; the real
--     bootstrap administrator is kept and receives its password via
--     `npm run db:admin`.

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'ROLE_CHANGED', 'STATUS_CHANGED', 'PASSWORD_CHANGED', 'PASSWORD_RESET', 'DELETED', 'PHONE_VERIFIED');

-- AlterEnum AccountStatus, mapping the registration-era values.
BEGIN;
CREATE TYPE "AccountStatus_new" AS ENUM ('ACTIVE', 'SUSPENDED');
ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" TYPE "AccountStatus_new" USING (
    (CASE "status"::text WHEN 'APPROVED' THEN 'ACTIVE' ELSE 'SUSPENDED' END)::"AccountStatus_new"
);
ALTER TYPE "AccountStatus" RENAME TO "AccountStatus_old";
ALTER TYPE "AccountStatus_new" RENAME TO "AccountStatus";
DROP TYPE "public"."AccountStatus_old";
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterEnum OtpPurpose: the only remaining flow is proving a new phone number.
DELETE FROM "phone_verification";
BEGIN;
CREATE TYPE "OtpPurpose_new" AS ENUM ('PHONE_CHANGE');
ALTER TABLE "phone_verification" ALTER COLUMN "purpose" TYPE "OtpPurpose_new" USING ('PHONE_CHANGE'::"OtpPurpose_new");
ALTER TYPE "OtpPurpose" RENAME TO "OtpPurpose_old";
ALTER TYPE "OtpPurpose_new" RENAME TO "OtpPurpose";
DROP TYPE "public"."OtpPurpose_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_reviewedById_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "reviewNote",
DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedById",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" UUID,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- Revoke every pre-password session.
DELETE FROM "sessions";

-- Remove the former self-registration test fixtures.
DELETE FROM "users" WHERE "username" IN ('ali.rezaei', 'sara.k', 'karim.t', 'nima.s');

-- CreateTable
CREATE TABLE "account_audit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actorId" UUID,
    "targetUserId" UUID,
    "action" "AuditAction" NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_audit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "account_audit_targetUserId_createdAt_idx" ON "account_audit"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "account_audit_createdAt_idx" ON "account_audit"("createdAt");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_audit" ADD CONSTRAINT "account_audit_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_audit" ADD CONSTRAINT "account_audit_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
