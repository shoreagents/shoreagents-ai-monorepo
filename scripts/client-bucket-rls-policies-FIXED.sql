-- RLS Policies for CLIENT Bucket with client_avatar and client_cover folders
-- Run this in Supabase SQL Editor

-- DROP OLD POLICIES FIRST (if they exist)
DROP POLICY IF EXISTS "Allow authenticated users to view client files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own folder in client" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files in client" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files in client" ON storage.objects;

-- 1. SELECT: Authenticated users can view files in client bucket
CREATE POLICY "Allow authenticated users to view client files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'client');

-- 2. INSERT: Users can upload to client_avatar or client_cover folders with their own userId
CREATE POLICY "Users can upload to their own folder in client"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client' AND
  (
    -- Allow client_avatar/{userId}/* pattern
    (
      (storage.foldername(name))[1] = 'client_avatar' AND
      (storage.foldername(name))[2] = auth.uid()::text
    )
    OR
    -- Allow client_cover/{userId}/* pattern
    (
      (storage.foldername(name))[1] = 'client_cover' AND
      (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

-- 3. UPDATE: Users can update their own files in client_avatar or client_cover
CREATE POLICY "Users can update their own files in client"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client' AND
  (
    -- Allow client_avatar/{userId}/* pattern
    (
      (storage.foldername(name))[1] = 'client_avatar' AND
      (storage.foldername(name))[2] = auth.uid()::text
    )
    OR
    -- Allow client_cover/{userId}/* pattern
    (
      (storage.foldername(name))[1] = 'client_cover' AND
      (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

-- 4. DELETE: Users can delete their own files in client_avatar or client_cover
CREATE POLICY "Users can delete their own files in client"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'client' AND
  (
    -- Allow client_avatar/{userId}/* pattern
    (
      (storage.foldername(name))[1] = 'client_avatar' AND
      (storage.foldername(name))[2] = auth.uid()::text
    )
    OR
    -- Allow client_cover/{userId}/* pattern
    (
      (storage.foldername(name))[1] = 'client_cover' AND
      (storage.foldername(name))[2] = auth.uid()::text
    )
  )
);

-- Verify policies were created
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%client%';

