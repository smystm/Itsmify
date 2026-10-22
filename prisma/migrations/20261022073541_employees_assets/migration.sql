-- The asset inventory code is generated from a sequence so concurrent
-- registrations cannot produce the same code.
CREATE SEQUENCE IF NOT EXISTS "asset_code_seq" START 1;

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('HARDWARE', 'SOFTWARE', 'NETWORK');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('COMPUTER', 'MONITOR', 'PRINTER', 'SCANNER', 'COPIER', 'PROJECTOR', 'KEYBOARD', 'MOUSE', 'SPEAKER', 'OTHER_HARDWARE', 'SOFTWARE', 'NETWORK_DEVICE');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'IN_STORAGE', 'IN_REPAIR', 'RETIRED', 'LOST');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('OFFICIAL', 'CONTRACTUAL', 'TEMPORARY', 'OTHER');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'INSTALLATION', 'OTHER');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "org_units" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT,
    "parentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "org_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "floor" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "building" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "personnelCode" TEXT,
    "nationalId" TEXT,
    "jobTitle" TEXT,
    "orgUnitId" UUID,
    "locationId" UUID,
    "employmentType" "EmploymentType",
    "hireDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assetCode" TEXT NOT NULL DEFAULT 'AST-' || lpad(nextval('asset_code_seq')::text, 5, '0'),
    "name" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "type" "AssetType" NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "orgUnitId" UUID,
    "locationId" UUID,
    "parentAssetId" UUID,
    "notes" TEXT,
    "createdById" UUID,
    "deletedById" UUID,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "computer_details" (
    "assetId" UUID NOT NULL,
    "systemType" TEXT,
    "motherboardBrand" TEXT,
    "motherboardModel" TEXT,
    "cpuTier" TEXT,
    "cpuModel" TEXT,
    "ramAmountGb" INTEGER,
    "ramType" TEXT,
    "storageInfo" TEXT,
    "gpuType" TEXT,
    "gpuBrand" TEXT,
    "gpuModel" TEXT,
    "gpuMemoryMb" INTEGER,
    "caseBrand" TEXT,
    "caseModel" TEXT,
    "psuBrand" TEXT,
    "psuModel" TEXT,
    "hasDvdWriter" BOOLEAN,
    "hasSeparateSpeaker" BOOLEAN,
    "speakerType" TEXT,
    "monitorInfo" TEXT,
    "osName" TEXT,
    "osEdition" TEXT,
    "osVersion" TEXT,
    "osInstalledOn" TIMESTAMP(3),
    "osBuild" TEXT,
    "officeVersion" TEXT,
    "systemUsername" TEXT,
    "automationUsername" TEXT,

    CONSTRAINT "computer_details_pkey" PRIMARY KEY ("assetId")
);

-- CreateTable
CREATE TABLE "monitor_details" (
    "assetId" UUID NOT NULL,
    "sizeInches" DECIMAL(4,1),
    "panelType" TEXT,
    "resolution" TEXT,

    CONSTRAINT "monitor_details_pkey" PRIMARY KEY ("assetId")
);

-- CreateTable
CREATE TABLE "peripheral_details" (
    "assetId" UUID NOT NULL,
    "connectionType" TEXT,
    "printerType" TEXT,
    "cartridgeModel" TEXT,
    "speakerType" TEXT,

    CONSTRAINT "peripheral_details_pkey" PRIMARY KEY ("assetId")
);

-- CreateTable
CREATE TABLE "network_details" (
    "assetId" UUID NOT NULL,
    "ipAddress" TEXT,
    "netboxTitle" TEXT,
    "hostname" TEXT,
    "macAddress" TEXT,
    "networkType" TEXT,
    "port" TEXT,

    CONSTRAINT "network_details_pkey" PRIMARY KEY ("assetId")
);

-- CreateTable
CREATE TABLE "software_details" (
    "assetId" UUID NOT NULL,
    "vendor" TEXT,
    "version" TEXT,
    "edition" TEXT,
    "licenseType" TEXT,
    "seatCount" INTEGER,
    "licenseExpiry" TIMESTAMP(3),
    "installedOn" TIMESTAMP(3),

    CONSTRAINT "software_details_pkey" PRIMARY KEY ("assetId")
);

-- CreateTable
CREATE TABLE "asset_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assetId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "assignedById" UUID,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "note" TEXT,

    CONSTRAINT "asset_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_maintenance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assetId" UUID NOT NULL,
    "type" "MaintenanceType" NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cost" DECIMAL(14,2),
    "vendor" TEXT,
    "performedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_operations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assetId" UUID,
    "employeeId" UUID,
    "operationType" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_inspections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assetId" UUID,
    "employeeId" UUID,
    "visitedAt" TIMESTAMP(3) NOT NULL,
    "visitType" TEXT,
    "healthPercent" INTEGER,
    "daysOfOperation" INTEGER,
    "temperature" DECIMAL(5,2),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "org_units_name_key" ON "org_units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "org_units_code_key" ON "org_units"("code");

-- CreateIndex
CREATE INDEX "org_units_parentId_idx" ON "org_units"("parentId");

-- CreateIndex
CREATE INDEX "locations_floor_idx" ON "locations"("floor");

-- CreateIndex
CREATE UNIQUE INDEX "locations_floor_roomNumber_key" ON "locations"("floor", "roomNumber");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profiles_userId_key" ON "employee_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profiles_personnelCode_key" ON "employee_profiles"("personnelCode");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profiles_nationalId_key" ON "employee_profiles"("nationalId");

-- CreateIndex
CREATE INDEX "employee_profiles_orgUnitId_idx" ON "employee_profiles"("orgUnitId");

-- CreateIndex
CREATE INDEX "employee_profiles_locationId_idx" ON "employee_profiles"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "assets_assetCode_key" ON "assets"("assetCode");

-- CreateIndex
CREATE INDEX "assets_category_status_idx" ON "assets"("category", "status");

-- CreateIndex
CREATE INDEX "assets_type_idx" ON "assets"("type");

-- CreateIndex
CREATE INDEX "assets_serialNumber_idx" ON "assets"("serialNumber");

-- CreateIndex
CREATE INDEX "assets_orgUnitId_idx" ON "assets"("orgUnitId");

-- CreateIndex
CREATE INDEX "assets_locationId_idx" ON "assets"("locationId");

-- CreateIndex
CREATE INDEX "assets_parentAssetId_idx" ON "assets"("parentAssetId");

-- CreateIndex
CREATE INDEX "assets_deletedAt_idx" ON "assets"("deletedAt");

-- CreateIndex
CREATE INDEX "network_details_ipAddress_idx" ON "network_details"("ipAddress");

-- CreateIndex
CREATE INDEX "asset_assignments_assetId_idx" ON "asset_assignments"("assetId");

-- CreateIndex
CREATE INDEX "asset_assignments_employeeId_returnedAt_idx" ON "asset_assignments"("employeeId", "returnedAt");

-- CreateIndex
CREATE INDEX "asset_assignments_returnedAt_idx" ON "asset_assignments"("returnedAt");

-- A single asset can only have one open assignment at a time. Closed rows
-- remain as the auditable assignment history.
CREATE UNIQUE INDEX "asset_assignments_one_open_per_asset" ON "asset_assignments"("assetId") WHERE "returnedAt" IS NULL;

-- CreateIndex
CREATE INDEX "asset_maintenance_assetId_status_idx" ON "asset_maintenance"("assetId", "status");

-- CreateIndex
CREATE INDEX "asset_maintenance_scheduledFor_idx" ON "asset_maintenance"("scheduledFor");

-- CreateIndex
CREATE INDEX "asset_operations_assetId_idx" ON "asset_operations"("assetId");

-- CreateIndex
CREATE INDEX "asset_operations_employeeId_idx" ON "asset_operations"("employeeId");

-- CreateIndex
CREATE INDEX "asset_operations_performedAt_idx" ON "asset_operations"("performedAt");

-- CreateIndex
CREATE INDEX "asset_inspections_assetId_idx" ON "asset_inspections"("assetId");

-- CreateIndex
CREATE INDEX "asset_inspections_employeeId_idx" ON "asset_inspections"("employeeId");

-- CreateIndex
CREATE INDEX "asset_inspections_visitedAt_idx" ON "asset_inspections"("visitedAt");

-- AddForeignKey
ALTER TABLE "org_units" ADD CONSTRAINT "org_units_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "org_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "org_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_orgUnitId_fkey" FOREIGN KEY ("orgUnitId") REFERENCES "org_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_parentAssetId_fkey" FOREIGN KEY ("parentAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "computer_details" ADD CONSTRAINT "computer_details_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitor_details" ADD CONSTRAINT "monitor_details_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peripheral_details" ADD CONSTRAINT "peripheral_details_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "network_details" ADD CONSTRAINT "network_details_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software_details" ADD CONSTRAINT "software_details_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_assignments" ADD CONSTRAINT "asset_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_maintenance" ADD CONSTRAINT "asset_maintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_maintenance" ADD CONSTRAINT "asset_maintenance_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_operations" ADD CONSTRAINT "asset_operations_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_operations" ADD CONSTRAINT "asset_operations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_inspections" ADD CONSTRAINT "asset_inspections_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_inspections" ADD CONSTRAINT "asset_inspections_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Every existing account is an employee. Backfilling an empty profile now
-- keeps the 1:1 invariant true and lets assets be assigned immediately.
INSERT INTO "employee_profiles" ("id", "userId", "createdAt", "updatedAt")
SELECT gen_random_uuid(), "id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users";
