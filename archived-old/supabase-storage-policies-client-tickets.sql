-- =====================================================
-- SUPABASE STORAGE POLICIES FOR CLIENT TICKET ATTACHMENTS
-- =====================================================
-- Bucket: client
-- Folder: client_ticket
-- Purpose: Allow clients to upload and view ticket attachments
-- =====================================================

-- 1. Allow clients to INSERT (upload) files to their own client_ticket folder
-- Pattern: client_ticket/{client_user_id}/{ticket_id}/{filename}
CREATE POLICY "Clients can upload ticket attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client'
  AND (storage.foldername(name))[1] = 'client_ticket'
  AND auth.jwt() ->> 'user_type' = 'client'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 2. Allow clients to SELECT (view/download) their own ticket attachments
CREATE POLICY "Clients can view their own ticket attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client'
  AND (storage.foldername(name))[1] = 'client_ticket'
  AND auth.jwt() ->> 'user_type' = 'client'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 3. Allow management to SELECT (view/download) all client ticket attachments
CREATE POLICY "Management can view all client ticket attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client'
  AND (storage.foldername(name))[1] = 'client_ticket'
  AND auth.jwt() ->> 'user_type' = 'management'
);

-- 4. Allow clients to DELETE their own ticket attachments (optional - if you want this)
CREATE POLICY "Clients can delete their own ticket attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'client'
  AND (storage.foldername(name))[1] = 'client_ticket'
  AND auth.jwt() ->> 'user_type' = 'client'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- 5. Allow management to DELETE any client ticket attachments (optional)
CREATE POLICY "Management can delete any client ticket attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'client'
  AND (storage.foldername(name))[1] = 'client_ticket'
  AND auth.jwt() ->> 'user_type' = 'management'
);

-- =====================================================
-- USAGE INSTRUCTIONS:
-- =====================================================
-- 1. Go to Supabase Dashboard > Storage > client bucket
-- 2. Go to Policies tab
-- 3. Run this SQL in the SQL Editor
-- 4. File structure will be: client_ticket/{clientUserId}/{ticketId}/filename.ext
-- 
-- Example file path:
-- client_ticket/clj8x9y2p0000356yfmkqwerx/clk1abc2d0000123xyz/screenshot.png
-- =====================================================

