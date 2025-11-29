-- Add clientId column for anonymous tracking and index for query performance
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "clientId" VARCHAR(64);
CREATE INDEX IF NOT EXISTS "Profile_clientId_createdAt_idx" ON "Profile" ("clientId", "createdAt");
