-- Secure study-pdfs storage bucket
-- Make bucket private
UPDATE storage.buckets 
SET public = false 
WHERE name = 'study-pdfs';

-- Drop existing public policies
DROP POLICY IF EXISTS "Anyone can view study PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete study PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their study PDFs" ON storage.objects;

-- Create secure authenticated policies
-- Note: These policies use email-based paths (studies.email) until user_id is added to studies table
CREATE POLICY "Authenticated users can view own PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'study-pdfs' AND
  EXISTS (
    SELECT 1 FROM public.studies
    WHERE studies.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND (storage.foldername(name))[1] = studies.email
  )
);

CREATE POLICY "Authenticated users can upload own PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'study-pdfs' AND
  (storage.foldername(name))[1] = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Authenticated users can update own PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'study-pdfs' AND
  EXISTS (
    SELECT 1 FROM public.studies
    WHERE studies.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND (storage.foldername(name))[1] = studies.email
  )
);

CREATE POLICY "Authenticated users can delete own PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'study-pdfs' AND
  EXISTS (
    SELECT 1 FROM public.studies
    WHERE studies.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND (storage.foldername(name))[1] = studies.email
  )
);