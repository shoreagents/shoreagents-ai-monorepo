-- Add JSON columns to performance_metrics table
ALTER TABLE performance_metrics 
ADD COLUMN applicationsUsed JSONB DEFAULT '[]',
ADD COLUMN visitedUrls JSONB DEFAULT '[]',
ADD COLUMN screenshotUrls JSONB DEFAULT '[]';
