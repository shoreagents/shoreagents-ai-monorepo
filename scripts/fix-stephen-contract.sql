-- Fix Stephen's job_acceptances record with real data from the hire
-- Job Acceptance ID: e87bf100-df82-4c52-81a6-f46cf41fc105

UPDATE job_acceptances
SET 
  salary = '300000',
  "shiftType" = 'DAY_SHIFT',
  "workLocation" = 'OFFICE',
  "hmoIncluded" = true,
  "leaveCredits" = 12,
  "workHours" = '09:00 - 18:00 Australia/Brisbane (9 hours, Monday to Friday)',
  "preferredStartDate" = '2025-11-12',
  "updatedAt" = NOW()
WHERE id = 'e87bf100-df82-4c52-81a6-f46cf41fc105';

-- Verify the update
SELECT 
  id,
  position,
  salary,
  "shiftType",
  "workLocation",
  "hmoIncluded",
  "leaveCredits",
  "workDays",
  "workStartTime",
  "workEndTime",
  "clientTimezone",
  "workHours"
FROM job_acceptances
WHERE id = 'e87bf100-df82-4c52-81a6-f46cf41fc105';

