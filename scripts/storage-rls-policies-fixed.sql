-- ============================================================
-- 🔒 SUPABASE STORAGE RLS POLICIES (FIXED)
-- ============================================================
-- The folder structure uses app user IDs (staff_users.id, etc)
-- NOT Supabase auth.uid(), so we need to join tables properly
-- ============================================================

-- ============================================================
-- 🟦 STAFF BUCKET POLICIES
-- ============================================================

-- Staff can upload to their own folders
CREATE POLICY "staff_upload_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff' 
  AND EXISTS (
    SELECT 1 FROM staff_users
    WHERE "authUserId" = auth.uid()::text
    AND id = (storage.foldername(storage.objects.name))[1]
  )
);

-- Staff can read their own files
CREATE POLICY "staff_read_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'staff' 
  AND EXISTS (
    SELECT 1 FROM staff_users
    WHERE "authUserId" = auth.uid()::text
    AND id = (storage.foldername(storage.objects.name))[1]
  )
);

-- Staff can update their own files
CREATE POLICY "staff_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'staff' 
  AND EXISTS (
    SELECT 1 FROM staff_users
    WHERE "authUserId" = auth.uid()::text
    AND id = (storage.foldername(storage.objects.name))[1]
  )
);

-- Staff can delete their own files
CREATE POLICY "staff_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'staff' 
  AND EXISTS (
    SELECT 1 FROM staff_users
    WHERE "authUserId" = auth.uid()::text
    AND id = (storage.foldername(storage.objects.name))[1]
  )
);

-- Management can read all staff files
CREATE POLICY "management_read_all_staff"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'staff'
  AND EXISTS (
    SELECT 1 FROM management_users 
    WHERE "authUserId" = auth.uid()::text
  )
);

-- Management can upload to any staff folder (for onboarding, etc.)
CREATE POLICY "management_upload_staff"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff'
  AND EXISTS (
    SELECT 1 FROM management_users 
    WHERE "authUserId" = auth.uid()::text
  )
);

-- Client can read their assigned staff's documents only
CREATE POLICY "client_read_assigned_staff_docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'staff'
  AND (storage.foldername(storage.objects.name))[2] = 'documents'
  AND EXISTS (
    SELECT 1 FROM staff_users su
    JOIN client_users cu ON su."companyId" = cu."companyId"
    WHERE cu."authUserId" = auth.uid()::text
    AND su.id = (storage.foldername(storage.objects.name))[1]
  )
);

-- ============================================================
-- 🟢 CLIENT BUCKET POLICIES
-- ============================================================

-- Client can upload to their own folders
CREATE POLICY "client_upload_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client' 
  AND EXISTS (
    SELECT 1 FROM client_users
    WHERE "authUserId" = auth.uid()::text
    AND id = (storage.foldername(storage.objects.name))[1]
  )
);

-- Client can read their own files
CREATE POLICY "client_read_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client' 
  AND EXISTS (
    SELECT 1 FROM client_users
    WHERE "authUserId" = auth.uid()::text
    AND id = (storage.foldername(storage.objects.name))[1]
  )
);

-- Client can update their own files
CREATE POLICY "client_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client' 
  AND EXISTS (
    SELECT 1 FROM client_users
    WHERE "authUserId" = auth.uid()::text
    AND id = (storage.foldername(storage.objects.name))[1]
  )
);

-- Client can delete their own files
CREATE POLICY "client_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'client' 
  AND EXISTS (
    SELECT 1 FROM client_users
    WHERE "authUserId" = auth.uid()::text
    AND id = (storage.foldername(storage.objects.name))[1]
  )
);

-- Management can read all client files
CREATE POLICY "management_read_all_client"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client'
  AND EXISTS (
    SELECT 1 FROM management_users 
    WHERE "authUserId" = auth.uid()::text
  )
);

-- Staff can read their client's documents
CREATE POLICY "staff_read_client_docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client'
  AND (storage.foldername(storage.objects.name))[2] = 'documents'
  AND EXISTS (
    SELECT 1 FROM staff_users su
    JOIN client_users cu ON su."companyId" = cu."companyId"
    WHERE su."authUserId" = auth.uid()::text
    AND cu.id = (storage.foldername(storage.objects.name))[1]
  )
);

-- ============================================================
-- 🟣 MANAGEMENT BUCKET POLICIES
-- ============================================================

-- Management can upload to their own folders
CREATE POLICY "management_upload_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'management' 
  AND EXISTS (
    SELECT 1 FROM management_users
    WHERE "authUserId" = auth.uid()::text
    AND id = (storage.foldername(storage.objects.name))[1]
  )
);

-- Management can read all management files
CREATE POLICY "management_read_all"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'management'
  AND EXISTS (
    SELECT 1 FROM management_users 
    WHERE "authUserId" = auth.uid()::text
  )
);

-- Management can update their own files
CREATE POLICY "management_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'management' 
  AND EXISTS (
    SELECT 1 FROM management_users
    WHERE "authUserId" = auth.uid()::text
    AND id = (storage.foldername(storage.objects.name))[1]
  )
);

-- Management can delete their own files
CREATE POLICY "management_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'management' 
  AND EXISTS (
    SELECT 1 FROM management_users
    WHERE "authUserId" = auth.uid()::text
    AND id = (storage.foldername(storage.objects.name))[1]
  )
);

-- Staff can read company-wide documents
CREATE POLICY "staff_read_company_docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'management'
  AND (storage.foldername(storage.objects.name))[2] = 'documents'
  AND EXISTS (
    SELECT 1 FROM staff_users 
    WHERE "authUserId" = auth.uid()::text
  )
);

-- Client can read documents shared with them
CREATE POLICY "client_read_shared_docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'management'
  AND (storage.foldername(storage.objects.name))[2] = 'documents'
  AND EXISTS (
    SELECT 1 FROM client_users 
    WHERE "authUserId" = auth.uid()::text
  )
);

-- ============================================================
-- ✅ DONE! RLS POLICIES CREATED
-- ============================================================
-- 
-- KEY CHANGE:
-- Instead of comparing auth.uid() directly to folder names,
-- we JOIN to the user tables and compare app user IDs.
--
-- LOGIC:
-- 1. Get auth.uid() (Supabase auth user ID)
-- 2. Find the app user (staff_users, client_users, management_users)
-- 3. Compare app user.id to folder name
--
-- This works because:
-- - File paths use: staff/{staff_users.id}/...
-- - auth.uid() links via: staff_users.authUserId
--
-- ============================================================

