-- RLS Policies for CLIENT Bucket
-- Run this in Supabase SQL Editor

-- 1. SELECT: Authenticated users can view files in client bucket
CREATE POLICY "Allow authenticated users to view client files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'client');

-- 2. INSERT: Users can upload to their own folder in client bucket
CREATE POLICY "Users can upload to their own folder in client"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. UPDATE: Users can update their own files in client bucket
CREATE POLICY "Users can update their own files in client"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. DELETE: Users can delete their own files in client bucket
CREATE POLICY "Users can delete their own files in client"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'client' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

