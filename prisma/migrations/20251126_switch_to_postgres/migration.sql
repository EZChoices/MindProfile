-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceMode" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "thinkingStyle" TEXT NOT NULL,
    "communicationStyle" TEXT NOT NULL,
    "strengthsJson" TEXT NOT NULL,
    "blindSpotsJson" TEXT NOT NULL,
    "suggestedJson" TEXT NOT NULL,
    "rawText" TEXT NOT NULL
);
