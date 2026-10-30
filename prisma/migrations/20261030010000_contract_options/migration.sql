-- The brand list grows into a generic contract-option list: one admin-managed
-- dropdown per categorical asset field. Existing brands are copied first so no
-- asset loses a value.

CREATE TYPE "ContractOptionKind" AS ENUM (
    'BRAND',
    'SYSTEM_TYPE',
    'MOTHERBOARD_BRAND',
    'CPU_TIER',
    'RAM_TYPE',
    'GPU_TYPE',
    'GPU_BRAND',
    'CASE_BRAND',
    'PSU_BRAND',
    'SPEAKER_TYPE',
    'OS_NAME',
    'OS_EDITION',
    'OFFICE_VERSION',
    'PANEL_TYPE',
    'RESOLUTION',
    'CONNECTION_TYPE',
    'PRINTER_TYPE',
    'NETWORK_TYPE',
    'SOFTWARE_VENDOR',
    'LICENSE_TYPE',
    'SOFTWARE_EDITION'
);

CREATE TABLE "contract_options" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "ContractOptionKind" NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_options_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "contract_options_kind_nameKey_key" ON "contract_options"("kind", "nameKey");
CREATE INDEX "contract_options_kind_idx" ON "contract_options"("kind");

-- Preserve every brand the admin already added, including its display casing.
INSERT INTO "contract_options" ("id", "kind", "name", "nameKey", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'BRAND', "name", "nameKey", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "asset_brands";

DO $$
DECLARE
    brand_rows integer;
    copied_rows integer;
BEGIN
    SELECT COUNT(*) INTO brand_rows FROM "asset_brands";
    SELECT COUNT(*) INTO copied_rows FROM "contract_options" WHERE "kind" = 'BRAND';
    IF copied_rows <> brand_rows THEN
        RAISE EXCEPTION 'copied % brand(s) but expected %', copied_rows, brand_rows;
    END IF;
END $$;

DROP TABLE "asset_brands";

-- Standard values. `ON CONFLICT DO NOTHING` keeps the admin's existing brands
-- and makes this seed safe to re-run.
INSERT INTO "contract_options" ("id", "kind", "name", "nameKey", "createdAt", "updatedAt") VALUES
    (gen_random_uuid(), 'BRAND', 'Dell', 'dell', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'HP', 'hp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Lenova', 'lenova', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Asus', 'asus', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Acer', 'acer', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Apple', 'apple', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'MSI', 'msi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Gigabyte', 'gigabyte', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Samsung', 'samsung', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'LG', 'lg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Microsoft', 'microsoft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Toshiba', 'toshiba', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Fujitsu', 'fujitsu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Huawei', 'huawei', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Cisco', 'cisco', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'TP-Link', 'tp-link', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'D-Link', 'd-link', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Canon', 'canon', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Epson', 'epson', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Brother', 'brother', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Xerox', 'xerox', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Ricoh', 'ricoh', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Kyocera', 'kyocera', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Logitech', 'logitech', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'BRAND', 'Genius', 'genius', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'SYSTEM_TYPE', 'Desktop', 'desktop', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SYSTEM_TYPE', 'Laptop', 'laptop', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SYSTEM_TYPE', 'All-in-One', 'all-in-one', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SYSTEM_TYPE', 'Mini PC', 'mini pc', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SYSTEM_TYPE', 'Workstation', 'workstation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SYSTEM_TYPE', 'Server', 'server', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'MOTHERBOARD_BRAND', 'Asus', 'asus', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'MOTHERBOARD_BRAND', 'MSI', 'msi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'MOTHERBOARD_BRAND', 'Gigabyte', 'gigabyte', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'MOTHERBOARD_BRAND', 'ASRock', 'asrock', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'MOTHERBOARD_BRAND', 'Intel', 'intel', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'MOTHERBOARD_BRAND', 'Dell', 'dell', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'MOTHERBOARD_BRAND', 'HP', 'hp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'MOTHERBOARD_BRAND', 'Lenovo', 'lenovo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'MOTHERBOARD_BRAND', 'Biostar', 'biostar', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'MOTHERBOARD_BRAND', 'Supermicro', 'supermicro', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'CPU_TIER', 'Core i3', 'core i3', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CPU_TIER', 'Core i5', 'core i5', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CPU_TIER', 'Core i7', 'core i7', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CPU_TIER', 'Core i9', 'core i9', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CPU_TIER', 'Ryzen 3', 'ryzen 3', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CPU_TIER', 'Ryzen 5', 'ryzen 5', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CPU_TIER', 'Ryzen 7', 'ryzen 7', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CPU_TIER', 'Ryzen 9', 'ryzen 9', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CPU_TIER', 'Xeon', 'xeon', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CPU_TIER', 'Celeron', 'celeron', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CPU_TIER', 'Pentium', 'pentium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CPU_TIER', 'Athlon', 'athlon', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'RAM_TYPE', 'DDR3', 'ddr3', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'RAM_TYPE', 'DDR4', 'ddr4', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'RAM_TYPE', 'DDR5', 'ddr5', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'RAM_TYPE', 'LPDDR4', 'lpddr4', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'RAM_TYPE', 'LPDDR5', 'lpddr5', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'RAM_TYPE', 'ECC DDR4', 'ecc ddr4', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'RAM_TYPE', 'ECC DDR5', 'ecc ddr5', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'GPU_TYPE', 'Integrated', 'integrated', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'GPU_TYPE', 'Dedicated', 'dedicated', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'GPU_BRAND', 'NVIDIA', 'nvidia', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'GPU_BRAND', 'AMD', 'amd', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'GPU_BRAND', 'Intel', 'intel', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'CASE_BRAND', 'Cooler Master', 'cooler master', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CASE_BRAND', 'Corsair', 'corsair', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CASE_BRAND', 'Thermaltake', 'thermaltake', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CASE_BRAND', 'DeepCool', 'deepcool', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CASE_BRAND', 'Zalman', 'zalman', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CASE_BRAND', 'Green', 'green', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CASE_BRAND', 'TSCO', 'tsco', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CASE_BRAND', 'Gigabyte', 'gigabyte', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CASE_BRAND', 'ASUS', 'asus', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CASE_BRAND', 'MSI', 'msi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'PSU_BRAND', 'Corsair', 'corsair', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PSU_BRAND', 'Cooler Master', 'cooler master', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PSU_BRAND', 'Thermaltake', 'thermaltake', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PSU_BRAND', 'DeepCool', 'deepcool', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PSU_BRAND', 'Seasonic', 'seasonic', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PSU_BRAND', 'FSP', 'fsp', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PSU_BRAND', 'Green', 'green', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PSU_BRAND', 'TSCO', 'tsco', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PSU_BRAND', 'Gigabyte', 'gigabyte', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PSU_BRAND', 'EVGA', 'evga', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'SPEAKER_TYPE', '2.0', '2.0', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SPEAKER_TYPE', '2.1', '2.1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SPEAKER_TYPE', '5.1', '5.1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SPEAKER_TYPE', 'Soundbar', 'soundbar', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SPEAKER_TYPE', 'Portable', 'portable', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SPEAKER_TYPE', 'Built-in', 'built-in', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'OS_NAME', 'Windows', 'windows', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OS_NAME', 'Windows Server', 'windows server', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OS_NAME', 'Linux', 'linux', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OS_NAME', 'macOS', 'macos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OS_NAME', 'ChromeOS', 'chromeos', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'OS_EDITION', 'Home', 'home', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OS_EDITION', 'Pro', 'pro', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OS_EDITION', 'Enterprise', 'enterprise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OS_EDITION', 'Education', 'education', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OS_EDITION', 'Pro for Workstations', 'pro for workstations', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OS_EDITION', 'Standard', 'standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OS_EDITION', 'Datacenter', 'datacenter', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'OFFICE_VERSION', 'Office 2010', 'office 2010', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OFFICE_VERSION', 'Office 2013', 'office 2013', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OFFICE_VERSION', 'Office 2016', 'office 2016', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OFFICE_VERSION', 'Office 2019', 'office 2019', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OFFICE_VERSION', 'Office 2021', 'office 2021', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OFFICE_VERSION', 'Microsoft 365', 'microsoft 365', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'OFFICE_VERSION', 'Office 365', 'office 365', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'PANEL_TYPE', 'IPS', 'ips', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PANEL_TYPE', 'VA', 'va', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PANEL_TYPE', 'TN', 'tn', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PANEL_TYPE', 'OLED', 'oled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PANEL_TYPE', 'PLS', 'pls', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'RESOLUTION', '1366x768 (HD)', '1366x768 (hd)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'RESOLUTION', '1600x900 (HD+)', '1600x900 (hd+)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'RESOLUTION', '1920x1080 (Full HD)', '1920x1080 (full hd)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'RESOLUTION', '2560x1440 (QHD)', '2560x1440 (qhd)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'RESOLUTION', '3440x1440 (UltraWide QHD)', '3440x1440 (ultrawide qhd)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'RESOLUTION', '3840x2160 (4K UHD)', '3840x2160 (4k uhd)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'RESOLUTION', '5120x2880 (5K)', '5120x2880 (5k)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'CONNECTION_TYPE', 'USB', 'usb', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CONNECTION_TYPE', 'USB-C', 'usb-c', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CONNECTION_TYPE', 'Bluetooth', 'bluetooth', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CONNECTION_TYPE', 'Wireless', 'wireless', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CONNECTION_TYPE', 'PS/2', 'ps/2', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CONNECTION_TYPE', 'Ethernet', 'ethernet', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CONNECTION_TYPE', 'Wi-Fi', 'wi-fi', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'CONNECTION_TYPE', 'Serial', 'serial', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'PRINTER_TYPE', 'Laser', 'laser', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PRINTER_TYPE', 'Inkjet', 'inkjet', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PRINTER_TYPE', 'LED', 'led', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PRINTER_TYPE', 'Thermal', 'thermal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PRINTER_TYPE', 'Dot Matrix', 'dot matrix', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'PRINTER_TYPE', 'Multifunction', 'multifunction', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'NETWORK_TYPE', 'LAN', 'lan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'NETWORK_TYPE', 'WAN', 'wan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'NETWORK_TYPE', 'WLAN', 'wlan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'NETWORK_TYPE', 'VPN', 'vpn', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'NETWORK_TYPE', 'VLAN', 'vlan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'NETWORK_TYPE', 'SD-WAN', 'sd-wan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'SOFTWARE_VENDOR', 'Microsoft', 'microsoft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_VENDOR', 'Adobe', 'adobe', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_VENDOR', 'Oracle', 'oracle', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_VENDOR', 'SAP', 'sap', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_VENDOR', 'Autodesk', 'autodesk', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_VENDOR', 'VMware', 'vmware', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_VENDOR', 'Citrix', 'citrix', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_VENDOR', 'IBM', 'ibm', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_VENDOR', 'Google', 'google', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_VENDOR', 'Apple', 'apple', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_VENDOR', 'Kaspersky', 'kaspersky', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_VENDOR', 'ESET', 'eset', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'LICENSE_TYPE', 'Perpetual', 'perpetual', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'LICENSE_TYPE', 'Subscription', 'subscription', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'LICENSE_TYPE', 'Volume', 'volume', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'LICENSE_TYPE', 'OEM', 'oem', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'LICENSE_TYPE', 'Retail', 'retail', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'LICENSE_TYPE', 'Open Source', 'open source', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'LICENSE_TYPE', 'Trial', 'trial', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'LICENSE_TYPE', 'Academic', 'academic', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

    (gen_random_uuid(), 'SOFTWARE_EDITION', 'Standard', 'standard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_EDITION', 'Professional', 'professional', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_EDITION', 'Enterprise', 'enterprise', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_EDITION', 'Ultimate', 'ultimate', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_EDITION', 'Home', 'home', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_EDITION', 'Education', 'education', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_EDITION', 'Business', 'business', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'SOFTWARE_EDITION', 'Premium', 'premium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("kind", "nameKey") DO NOTHING;
