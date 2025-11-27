-- Add feedback fields to Profile
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "resonance" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "feedbackText" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "feedbackAt" TIMESTAMP;
