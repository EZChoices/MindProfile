-- Manual migration to align with new Profile schema
ALTER TABLE "Profile" ALTER COLUMN "sourceMode" TYPE VARCHAR(32);

ALTER TABLE "Profile" ALTER COLUMN "strengthsJson" TYPE JSONB USING "strengthsJson"::jsonb;
ALTER TABLE "Profile" ALTER COLUMN "blindSpotsJson" TYPE JSONB USING "blindSpotsJson"::jsonb;
ALTER TABLE "Profile" ALTER COLUMN "suggestedJson" TYPE JSONB USING "suggestedJson"::jsonb;

ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "model" TEXT NOT NULL DEFAULT 'gpt-4.1-mini';
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "promptVersion" TEXT NOT NULL DEFAULT 'v0.1';
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "inputCharCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "inputSourceHost" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "promptTokens" INTEGER;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "completionTokens" INTEGER;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Profile_createdAt_idx" ON "Profile" ("createdAt");
CREATE INDEX IF NOT EXISTS "Profile_sourceMode_idx" ON "Profile" ("sourceMode");
