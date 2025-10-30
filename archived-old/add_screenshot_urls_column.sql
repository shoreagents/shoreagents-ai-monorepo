-- Add screenshotUrls column to performance_metrics table
ALTER TABLE performance_metrics 
ADD COLUMN IF NOT EXISTS "screenshotUrls" JSONB DEFAULT '[]'::jsonb;
