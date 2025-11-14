-- Fix reviewer_configs RLS policies - restrict to user-owned configs only
DROP POLICY IF EXISTS "Authenticated users can manage reviewer configs" ON reviewer_configs;
DROP POLICY IF EXISTS "Authenticated users can view reviewer configs" ON reviewer_configs;

CREATE POLICY "Users can view own reviewer configs"
  ON reviewer_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviewer configs"
  ON reviewer_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviewer configs"
  ON reviewer_configs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviewer configs"
  ON reviewer_configs FOR DELETE
  USING (auth.uid() = user_id);

-- Fix study-pdfs bucket - make private and add user-scoped RLS
UPDATE storage.buckets 
SET public = false 
WHERE id = 'study-pdfs';

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own PDFs" ON storage.objects;

-- Create user-scoped storage policies
CREATE POLICY "Users can upload own PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'study-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'study-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own PDFs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'study-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'study-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own PDFs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'study-pdfs' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );