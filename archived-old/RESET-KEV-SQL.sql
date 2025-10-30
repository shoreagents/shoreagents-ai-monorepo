-- RESET KEV'S ONBOARDING DATA
-- Run this SQL in Supabase SQL Editor

-- Step 1: Get Kev's UUID (copy this ID for next steps)
SELECT id FROM staff_users WHERE email = 'kev@kev.com';

-- Step 2: Delete all related data (replace 'KEV_UUID_HERE' with actual ID from step 1)
-- Work Schedules
DELETE FROM work_schedules 
WHERE "profileId" IN (
  SELECT id FROM staff_profiles WHERE "staffUserId" = 'KEV_UUID_HERE'
);

-- Personal Records
DELETE FROM staff_personal_records WHERE "staffUserId" = 'KEV_UUID_HERE';

-- Staff Profile
DELETE FROM staff_profiles WHERE "staffUserId" = 'KEV_UUID_HERE';

-- Reset Staff User
UPDATE staff_users 
SET "companyId" = NULL, 
    name = 'Kev Macabanitititi' 
WHERE id = 'KEV_UUID_HERE';

-- Reset Onboarding to PENDING
UPDATE staff_onboarding 
SET 
  "isComplete" = false,
  "completionPercent" = 0,
  "personalInfoStatus" = 'PENDING',
  "govIdStatus" = 'PENDING',
  "documentsStatus" = 'PENDING',
  "signatureStatus" = 'PENDING',
  "emergencyContactStatus" = 'PENDING',
  "personalInfoFeedback" = NULL,
  "govIdFeedback" = NULL,
  "documentsFeedback" = NULL,
  "signatureFeedback" = NULL,
  "emergencyContactFeedback" = NULL,
  "personalInfoVerifiedAt" = NULL,
  "govIdVerifiedAt" = NULL,
  "documentsVerifiedAt" = NULL,
  "signatureVerifiedAt" = NULL,
  "emergencyContactVerifiedAt" = NULL
WHERE "staffUserId" = 'KEV_UUID_HERE';

-- Verify it worked
SELECT 
  name, 
  email, 
  "companyId"
FROM staff_users 
WHERE email = 'kev@kev.com';

SELECT 
  "completionPercent", 
  "isComplete", 
  "personalInfoStatus",
  "govIdStatus",
  "documentsStatus",
  "signatureStatus",
  "emergencyContactStatus"
FROM staff_onboarding
WHERE "staffUserId" = 'KEV_UUID_HERE';

