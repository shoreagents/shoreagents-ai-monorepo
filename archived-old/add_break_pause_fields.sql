-- Add pause fields to breaks table
ALTER TABLE breaks 
ADD COLUMN isPaused BOOLEAN DEFAULT FALSE,
ADD COLUMN pausedAt TIMESTAMP,
ADD COLUMN pausedDuration INTEGER DEFAULT 0;


