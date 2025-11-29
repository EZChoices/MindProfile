-- Create table for analysis error logging
CREATE TABLE IF NOT EXISTS "AnalysisLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" VARCHAR(64),
    "sourceMode" VARCHAR(32),
    "inputCharCount" INTEGER,
    "errorCode" VARCHAR(64),
    "message" TEXT,
    "meta" JSONB,
    CONSTRAINT "AnalysisLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AnalysisLog_createdAt_idx" ON "AnalysisLog" ("createdAt");
CREATE INDEX IF NOT EXISTS "AnalysisLog_clientId_idx" ON "AnalysisLog" ("clientId");
