-- Safe migration script for Company structure
-- Checks if columns exist before modifying them

-- ============================================
-- 1. UPDATE COMPANY TABLE
-- ============================================

-- Add organizationId if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'company' 
    AND column_name = 'organizationId'
  ) THEN
    ALTER TABLE public.company ADD COLUMN "organizationId" TEXT;
    
    -- Generate organizationId for existing records
    UPDATE public.company 
    SET "organizationId" = CONCAT('org_', SUBSTRING(id, 1, 12))
    WHERE "organizationId" IS NULL;
    
    -- Make it NOT NULL
    ALTER TABLE public.company ALTER COLUMN "organizationId" SET NOT NULL;
    
    -- Add unique constraint
    ALTER TABLE public.company ADD CONSTRAINT "company_organizationId_key" UNIQUE ("organizationId");
  END IF;
END $$;

-- Add logo column
ALTER TABLE public.company ADD COLUMN IF NOT EXISTS "logo" TEXT;

-- Add accountManagerId column
ALTER TABLE public.company ADD COLUMN IF NOT EXISTS "accountManagerId" TEXT;

-- Add foreign key for accountManagerId
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_accountManagerId_fkey'
  ) THEN
    ALTER TABLE public.company 
    ADD CONSTRAINT "company_accountManagerId_fkey" 
    FOREIGN KEY ("accountManagerId") 
    REFERENCES public.management_users(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- 2. UPDATE STAFF_USERS TABLE
-- ============================================

-- Add companyId to staff_users
ALTER TABLE public.staff_users ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Add foreign key for staff_users.companyId
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_users_companyId_fkey'
  ) THEN
    ALTER TABLE public.staff_users 
    ADD CONSTRAINT "staff_users_companyId_fkey" 
    FOREIGN KEY ("companyId") 
    REFERENCES public.company(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- 3. UPDATE CLIENT_USERS TABLE
-- ============================================

-- Rename clientId to companyId if clientId exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'client_users' 
    AND column_name = 'clientId'
  ) THEN
    ALTER TABLE public.client_users RENAME COLUMN "clientId" TO "companyId";
  END IF;
END $$;

-- If companyId doesn't exist yet, add it
ALTER TABLE public.client_users ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Add coverPhoto column
ALTER TABLE public.client_users ADD COLUMN IF NOT EXISTS "coverPhoto" TEXT;

-- Drop old foreign key constraint if it exists
ALTER TABLE public.client_users DROP CONSTRAINT IF EXISTS "client_users_clientId_fkey";

-- Add new foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_users_companyId_fkey'
  ) THEN
    ALTER TABLE public.client_users 
    ADD CONSTRAINT "client_users_companyId_fkey" 
    FOREIGN KEY ("companyId") 
    REFERENCES public.company(id) 
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- 4. UPDATE STAFF_ASSIGNMENTS TABLE
-- ============================================

-- Rename clientId to companyId if clientId exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'staff_assignments' 
    AND column_name = 'clientId'
  ) THEN
    ALTER TABLE public.staff_assignments RENAME COLUMN "clientId" TO "companyId";
  END IF;
END $$;

-- If companyId doesn't exist yet, add it
ALTER TABLE public.staff_assignments ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Drop old unique constraint if it exists
ALTER TABLE public.staff_assignments DROP CONSTRAINT IF EXISTS "staff_assignments_staffUserId_clientId_key";

-- Add new unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_assignments_staffUserId_companyId_key'
  ) THEN
    ALTER TABLE public.staff_assignments 
    ADD CONSTRAINT "staff_assignments_staffUserId_companyId_key" 
    UNIQUE ("staffUserId", "companyId");
  END IF;
END $$;

-- Drop old foreign key constraint
ALTER TABLE public.staff_assignments DROP CONSTRAINT IF EXISTS "staff_assignments_clientId_fkey";

-- Add new foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_assignments_companyId_fkey'
  ) THEN
    ALTER TABLE public.staff_assignments 
    ADD CONSTRAINT "staff_assignments_companyId_fkey" 
    FOREIGN KEY ("companyId") 
    REFERENCES public.company(id) 
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check company table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'company' 
ORDER BY ordinal_position;

-- Check client_users companyId
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'client_users' 
AND column_name = 'companyId';

-- Check staff_assignments companyId
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'staff_assignments' 
AND column_name = 'companyId';

