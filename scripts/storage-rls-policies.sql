-- ============================================================
-- 🔒 SUPABASE STORAGE RLS POLICIES
-- ============================================================
-- Run this SQL in your Supabase SQL Editor to set up
-- Row Level Security for the 3 storage buckets
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
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Staff can read their own files
CREATE POLICY "staff_read_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'staff' 
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Staff can update their own files
CREATE POLICY "staff_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'staff' 
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Staff can delete their own files
CREATE POLICY "staff_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'staff' 
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Management can read all staff files
CREATE POLICY "management_read_all_staff"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'staff'
  AND EXISTS (
    SELECT 1 FROM management_users 
    WHERE "authUserId" = auth.uid()
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
    WHERE "authUserId" = auth.uid()
  )
);

-- Client can read their assigned staff's documents only
CREATE POLICY "client_read_assigned_staff_docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'staff'
  AND (storage.foldername(name))[2] = 'documents'
  AND EXISTS (
    SELECT 1 FROM staff_users su
    JOIN client_users cu ON su."companyId" = cu."companyId"
    WHERE cu."authUserId" = auth.uid()
    AND su.id::text = (storage.foldername(name))[1]
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
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Client can read their own files
CREATE POLICY "client_read_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client' 
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Client can update their own files
CREATE POLICY "client_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client' 
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Client can delete their own files
CREATE POLICY "client_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'client' 
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Management can read all client files
CREATE POLICY "management_read_all_client"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client'
  AND EXISTS (
    SELECT 1 FROM management_users 
    WHERE "authUserId" = auth.uid()
  )
);

-- Staff can read their client's documents
CREATE POLICY "staff_read_client_docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client'
  AND (storage.foldername(name))[2] = 'documents'
  AND EXISTS (
    SELECT 1 FROM staff_users su
    JOIN client_users cu ON su."companyId" = cu."companyId"
    WHERE su."authUserId" = auth.uid()
    AND cu.id::text = (storage.foldername(name))[1]
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
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Management can read all management files
CREATE POLICY "management_read_all"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'management'
  AND EXISTS (
    SELECT 1 FROM management_users 
    WHERE "authUserId" = auth.uid()
  )
);

-- Management can update their own files
CREATE POLICY "management_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'management' 
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Management can delete their own files
CREATE POLICY "management_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'management' 
  AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Staff can read company-wide documents
CREATE POLICY "staff_read_company_docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'management'
  AND (storage.foldername(name))[2] = 'documents'
  AND EXISTS (
    SELECT 1 FROM staff_users 
    WHERE "authUserId" = auth.uid()
  )
);

-- Client can read documents shared with them
CREATE POLICY "client_read_shared_docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'management'
  AND (storage.foldername(name))[2] = 'documents'
  AND EXISTS (
    SELECT 1 FROM client_users 
    WHERE "authUserId" = auth.uid()
  )
);

-- ============================================================
-- ✅ DONE! RLS POLICIES CREATED
-- ============================================================
-- 
-- WHAT THESE DO:
--
-- 🟦 STAFF BUCKET:
--    ✅ Staff can upload/read/update/delete their own files
--    ✅ Management can read ALL staff files (oversight)
--    ✅ Management can upload to staff folders (onboarding)
--    ✅ Client can read their staff's DOCUMENTS folder only
--
-- 🟢 CLIENT BUCKET:
--    ✅ Client can upload/read/update/delete their own files
--    ✅ Management can read ALL client files (oversight)
--    ✅ Staff can read their client's DOCUMENTS folder
--
-- 🟣 MANAGEMENT BUCKET:
--    ✅ Management can upload/read/update/delete their own files
--    ✅ All management can read all management files (company-wide)
--    ✅ Staff can read company documents folder (policies, handbooks)
--    ✅ Client can read shared documents folder
--
-- ============================================================

