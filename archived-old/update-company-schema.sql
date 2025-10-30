-- Add missing columns to company table
ALTER TABLE public.company 
ADD COLUMN IF NOT EXISTS "organizationId" TEXT,
ADD COLUMN IF NOT EXISTS "logo" TEXT,
ADD COLUMN IF NOT EXISTS "accountManagerId" TEXT;

-- Add unique constraint for organizationId
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_organizationId_key') THEN
    ALTER TABLE public.company ADD CONSTRAINT "company_organizationId_key" UNIQUE ("organizationId");
  END IF;
END $$;

-- Generate organizationId for existing records (if any)
UPDATE public.company 
SET "organizationId" = CONCAT('org_', id)
WHERE "organizationId" IS NULL;

-- Now make organizationId NOT NULL
ALTER TABLE public.company 
ALTER COLUMN "organizationId" SET NOT NULL;

-- Add foreign key for accountManagerId
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_accountManagerId_fkey') THEN
    ALTER TABLE public.company 
    ADD CONSTRAINT "company_accountManagerId_fkey" 
    FOREIGN KEY ("accountManagerId") 
    REFERENCES public.management_users(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Add companyId to staff_users
ALTER TABLE public.staff_users 
ADD COLUMN IF NOT EXISTS "companyId" TEXT;

-- Add foreign key for staff_users.companyId
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_users_companyId_fkey') THEN
    ALTER TABLE public.staff_users 
    ADD CONSTRAINT "staff_users_companyId_fkey" 
    FOREIGN KEY ("companyId") 
    REFERENCES public.company(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Rename clientId to companyId in client_users
ALTER TABLE public.client_users 
RENAME COLUMN "clientId" TO "companyId";

-- Add coverPhoto to client_users
ALTER TABLE public.client_users 
ADD COLUMN IF NOT EXISTS "coverPhoto" TEXT;

-- Update foreign key name in client_users
ALTER TABLE public.client_users 
DROP CONSTRAINT IF EXISTS "client_users_clientId_fkey";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_users_companyId_fkey') THEN
    ALTER TABLE public.client_users 
    ADD CONSTRAINT "client_users_companyId_fkey" 
    FOREIGN KEY ("companyId") 
    REFERENCES public.company(id) 
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Rename clientId to companyId in staff_assignments
ALTER TABLE public.staff_assignments 
RENAME COLUMN "clientId" TO "companyId";

-- Update unique constraint in staff_assignments
ALTER TABLE public.staff_assignments 
DROP CONSTRAINT IF EXISTS "staff_assignments_staffUserId_clientId_key";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_assignments_staffUserId_companyId_key') THEN
    ALTER TABLE public.staff_assignments 
    ADD CONSTRAINT "staff_assignments_staffUserId_companyId_key" 
    UNIQUE ("staffUserId", "companyId");
  END IF;
END $$;

-- Update foreign key in staff_assignments
ALTER TABLE public.staff_assignments 
DROP CONSTRAINT IF EXISTS "staff_assignments_clientId_fkey";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_assignments_companyId_fkey') THEN
    ALTER TABLE public.staff_assignments 
    ADD CONSTRAINT "staff_assignments_companyId_fkey" 
    FOREIGN KEY ("companyId") 
    REFERENCES public.company(id) 
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

