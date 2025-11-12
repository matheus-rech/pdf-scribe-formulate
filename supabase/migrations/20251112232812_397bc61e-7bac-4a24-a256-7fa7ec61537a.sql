-- Fix storage policies to use user_id-based paths instead of email-based paths
-- This aligns with how the application uploads files: userId/timestamp.ext

-- Drop existing email-based policies
DROP POLICY IF EXISTS "Authenticated users can upload own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own PDFs" ON storage.objects;

-- Create new user_id-based policies that match the application upload pattern
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'study-pdfs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'study-pdfs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'study-pdfs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'study-pdfs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);