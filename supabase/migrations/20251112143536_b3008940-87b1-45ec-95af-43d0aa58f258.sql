-- Rename projects to studies and add PDF storage
ALTER TABLE public.projects RENAME TO studies;

-- Add pdf_url column to store uploaded PDFs in storage
ALTER TABLE public.studies ADD COLUMN pdf_url TEXT;

-- Update foreign key in extractions table
ALTER TABLE public.extractions RENAME COLUMN project_id TO study_id;

-- Update indexes
DROP INDEX IF EXISTS idx_projects_email;
CREATE INDEX idx_studies_email ON public.studies(email);

-- Create storage bucket for study PDFs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'study-pdfs',
  'study-pdfs',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf']
);

-- Storage policies for study PDFs
CREATE POLICY "Anyone can view study PDFs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'study-pdfs');

CREATE POLICY "Users can upload study PDFs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'study-pdfs');

CREATE POLICY "Users can update their study PDFs"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'study-pdfs');

CREATE POLICY "Users can delete study PDFs"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'study-pdfs');