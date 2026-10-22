-- Preserve the assignment note and the return note as separate history fields.
ALTER TABLE "asset_assignments" ADD COLUMN "returnNote" TEXT;
