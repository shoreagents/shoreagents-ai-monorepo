-- ================================================================
-- ADD SHIFT DATE COLUMN TO time_entries
-- Run this in Supabase SQL Editor
-- ================================================================

-- Step 1: Add date column to time_entries (nullable at first)
ALTER TABLE time_entries 
ADD COLUMN IF NOT EXISTS date TIMESTAMP(3);

-- Step 2: Backfill existing records with their clockIn date (at midnight)
UPDATE time_entries 
SET date = DATE_TRUNC('day', "clockIn")
WHERE date IS NULL;

-- Step 3: Make it NOT NULL after backfilling
ALTER TABLE time_entries 
ALTER COLUMN date SET NOT NULL;

-- Step 4: Add index for performance
CREATE INDEX IF NOT EXISTS "time_entries_staffUserId_date_idx" 
ON time_entries("staffUserId", date);

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Check the new column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'time_entries' AND column_name = 'date';

-- Check the index was created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'time_entries' AND indexname = 'time_entries_staffUserId_date_idx';

-- Preview some data (should show date matching clockIn day)
SELECT 
  id, 
  "staffUserId", 
  date, 
  "clockIn",
  DATE_TRUNC('day', "clockIn") as expected_date,
  CASE 
    WHEN date = DATE_TRUNC('day', "clockIn") THEN '✅ Correct' 
    ELSE '❌ Mismatch' 
  END as validation
FROM time_entries 
ORDER BY "clockIn" DESC 
LIMIT 10;

-- ================================================================
-- DONE! 
-- After this, restart your Next.js server and Electron app.
-- ================================================================

