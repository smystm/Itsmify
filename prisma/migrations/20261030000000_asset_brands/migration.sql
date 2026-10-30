-- Brand choices are now admin-managed. Existing asset brands are seeded into
-- the list so no asset loses its value when the form becomes a dropdown.
CREATE TABLE "asset_brands" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_brands_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "asset_brands_nameKey_key" ON "asset_brands"("nameKey");

-- Pick one canonical spelling per case-insensitive/whitespace-normalized key.
-- The most frequently used spelling wins; ties fall back to alphabetical order.
WITH normalized AS (
    SELECT
        btrim(regexp_replace("brand", '[[:space:]]+', ' ', 'g')) AS display_name,
        lower(btrim(regexp_replace("brand", '[[:space:]]+', ' ', 'g'))) AS name_key
    FROM "assets"
    WHERE "brand" IS NOT NULL
      AND btrim(regexp_replace("brand", '[[:space:]]+', ' ', 'g')) <> ''
),
counted AS (
    SELECT display_name, name_key, COUNT(*) AS usage_count
    FROM normalized
    GROUP BY display_name, name_key
),
ranked AS (
    SELECT
        display_name,
        name_key,
        ROW_NUMBER() OVER (
            PARTITION BY name_key
            ORDER BY usage_count DESC, display_name ASC
        ) AS rn
    FROM counted
)
INSERT INTO "asset_brands" ("id", "name", "nameKey", "createdAt", "updatedAt")
SELECT gen_random_uuid(), display_name, name_key, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM ranked
WHERE rn = 1;

-- Apply the canonical spelling to every asset. This only changes casing and
-- repeated whitespace; it never clears a brand or changes which brand an asset
-- belongs to.
UPDATE "assets" AS a
SET "brand" = b."name"
FROM "asset_brands" AS b
WHERE a."brand" IS NOT NULL
  AND btrim(regexp_replace(a."brand", '[[:space:]]+', ' ', 'g')) <> ''
  AND lower(btrim(regexp_replace(a."brand", '[[:space:]]+', ' ', 'g'))) = b."nameKey"
  AND a."brand" <> b."name";

-- Fail the migration (and roll it back) if any non-empty asset brand did not
-- receive a canonical match.
DO $$
DECLARE
    unmatched integer;
BEGIN
    SELECT COUNT(*) INTO unmatched
    FROM "assets" AS a
    WHERE a."brand" IS NOT NULL
      AND btrim(regexp_replace(a."brand", '[[:space:]]+', ' ', 'g')) <> ''
      AND NOT EXISTS (
          SELECT 1 FROM "asset_brands" AS b WHERE b."name" = a."brand"
      );

    IF unmatched > 0 THEN
        RAISE EXCEPTION 'asset brand normalization left % asset(s) unmatched', unmatched;
    END IF;
END $$;
