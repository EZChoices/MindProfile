-- Add mindCard JSON column
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "mindCard" JSONB;
