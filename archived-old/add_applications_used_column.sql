-- Add applicationsUsed column to performance_metrics table
ALTER TABLE performance_metrics 
ADD COLUMN IF NOT EXISTS "applicationsUsed" JSONB DEFAULT '[]'::jsonb;
