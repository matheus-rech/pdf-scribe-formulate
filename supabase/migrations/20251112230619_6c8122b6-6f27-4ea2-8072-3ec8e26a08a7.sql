-- Remove legacy public storage upload policy that allows unauthenticated uploads
DROP POLICY IF EXISTS "Users can upload study PDFs" ON storage.objects;

-- Verify that only authenticated policies remain for study-pdfs bucket
-- The following policies should remain active:
-- 1. "Authenticated users can delete own PDFs" (authenticated users only)
-- 2. "Authenticated users can update own PDFs" (authenticated users only) 
-- 3. "Authenticated users can view own PDFs" (authenticated users only)
-- 4. "Authenticated users can upload PDFs" (authenticated users only)