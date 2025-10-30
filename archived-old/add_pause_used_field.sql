-- Add pauseused field to breaks table
ALTER TABLE breaks 
ADD COLUMN pauseused BOOLEAN DEFAULT FALSE;

