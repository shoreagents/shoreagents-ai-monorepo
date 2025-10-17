-- ============================================
-- CREATE TEST STAFF: SARAH TEST
-- Complete setup for testing review flow
-- ============================================

-- Step 1: Create Supabase Auth User
-- GO TO SUPABASE DASHBOARD:
-- https://supabase.com/dashboard/project/hdztsymxdgpcqtorjgou/auth/users
-- Click "Add User" -> "Create new user"
-- Email: sarah.test@test.com
-- Password: password123
-- Click "Create User"
-- COPY THE USER ID (it will look like: a1b2c3d4-e5f6-7890-abcd-ef1234567890)

-- Step 2: Create staff_users record
-- Replace YOUR_SUPABASE_USER_ID with the ID from Step 1
DO $$
DECLARE
  v_company_id uuid;
  v_staff_user_id uuid;
  v_supabase_auth_id text := 'YOUR_SUPABASE_USER_ID_HERE'; -- REPLACE THIS!
BEGIN
  -- Get StepTen company ID
  SELECT id INTO v_company_id FROM company WHERE "companyName" ILIKE '%stepten%' LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'StepTen company not found!';
  END IF;
  
  -- Generate staff user ID
  v_staff_user_id := gen_random_uuid();
  
  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE 'Staff User ID: %', v_staff_user_id;
  
  -- Create staff_users record
  INSERT INTO staff_users (
    id, 
    email, 
    name, 
    "authUserId", 
    "companyId", 
    role, 
    "createdAt", 
    "updatedAt"
  ) VALUES (
    v_staff_user_id,
    'sarah.test@test.com',
    'Sarah Test',
    v_supabase_auth_id,
    v_company_id,
    'STAFF',
    NOW(),
    NOW()
  );
  
  -- Create staff_profiles record (25 days ago for Month 1 review)
  INSERT INTO staff_profiles (
    id,
    "staffUserId",
    "startDate",
    phone,
    "employmentStatus",
    "daysEmployed",
    "currentRole",
    client,
    "createdAt",
    "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    v_staff_user_id,
    NOW() - INTERVAL '25 days',
    '+63 999 888 7777',
    'PROBATION',
    25,
    'Virtual Assistant',
    'StepTen',
    NOW(),
    NOW()
  );
  
  -- Create PENDING review
  INSERT INTO reviews (
    id,
    "staffUserId",
    type,
    status,
    client,
    reviewer,
    "reviewerTitle",
    "submittedDate",
    "dueDate",
    "evaluationPeriod",
    "createdAt",
    "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    v_staff_user_id,
    'MONTH_1',
    'PENDING',
    'StepTen',
    'stephen@stepten.io',
    'MANAGER',
    NOW(),
    NOW() + INTERVAL '7 days',
    'Day 1 to Day 25',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ SUCCESS! Created:';
  RAISE NOTICE '   Staff: Sarah Test (sarah.test@test.com)';
  RAISE NOTICE '   Password: password123';
  RAISE NOTICE '   Company: StepTen';
  RAISE NOTICE '   Review: PENDING for stephen@stepten.io';
END $$;

-- Step 3: Verify
SELECT 
  s.name,
  s.email,
  s."authUserId",
  c."companyName",
  p."startDate",
  p."employmentStatus"
FROM staff_users s
JOIN company c ON s."companyId" = c.id
LEFT JOIN staff_profiles p ON s.id = p."staffUserId"
WHERE s.email = 'sarah.test@test.com';

-- Step 4: Verify Review
SELECT 
  r.id as review_id,
  s.name as staff_name,
  r.type,
  r.status,
  r.reviewer,
  r."dueDate"
FROM reviews r
JOIN staff_users s ON r."staffUserId" = s.id
WHERE s.email = 'sarah.test@test.com';

-- ============================================
-- CREDENTIALS FOR TESTING:
-- ============================================
-- STAFF LOGIN: sarah.test@test.com / password123
-- CLIENT LOGIN: stephen@stepten.io / qwerty12345
-- ADMIN LOGIN: stephena@shoreagents.com / qwerty12345
-- ============================================

