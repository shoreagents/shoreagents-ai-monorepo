-- Add pause-related columns to breaks table
ALTER TABLE breaks 
ADD COLUMN ispaused BOOLEAN DEFAULT FALSE,
ADD COLUMN pausedat TIMESTAMP,
ADD COLUMN pausedduration INTEGER DEFAULT 0,
ADD COLUMN pauseused BOOLEAN DEFAULT FALSE;

-- Update existing records to ensure pauseused is false
UPDATE breaks SET pauseused = FALSE WHERE pauseused IS NULL;
