-- Make study-pdfs bucket public so PDFs can be loaded for chunking
UPDATE storage.buckets 
SET public = true 
WHERE id = 'study-pdfs';

-- Add public read policy for study-pdfs bucket
CREATE POLICY "Public PDFs in study-pdfs are viewable by everyone"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'study-pdfs');

-- Clean up the accidentally created pdfs bucket
DELETE FROM storage.buckets WHERE id = 'pdfs';