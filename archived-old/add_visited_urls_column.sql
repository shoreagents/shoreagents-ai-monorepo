-- Add visitedUrls column to performance_metrics table
ALTER TABLE performance_metrics 
ADD COLUMN IF NOT EXISTS "visitedUrls" JSONB DEFAULT '[]'::jsonb;
