-- Create table for Year in Rewind summaries
CREATE TABLE IF NOT EXISTS "YearSummary" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" VARCHAR(64),
    "year" INTEGER,
    "summaryJson" JSONB NOT NULL,
    "deletedAt" TIMESTAMP,
    CONSTRAINT "YearSummary_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "YearSummary_createdAt_idx" ON "YearSummary" ("createdAt");
CREATE INDEX IF NOT EXISTS "YearSummary_clientId_createdAt_idx" ON "YearSummary" ("clientId", "createdAt");
