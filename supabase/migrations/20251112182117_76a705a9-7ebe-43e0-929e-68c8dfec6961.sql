-- Add JSONB column for storing pre-processed PDF data
ALTER TABLE studies ADD COLUMN IF NOT EXISTS pdf_chunks JSONB;

-- Add index for faster chunk queries
CREATE INDEX IF NOT EXISTS idx_studies_pdf_chunks ON studies USING gin(pdf_chunks);

-- Add comment for documentation
COMMENT ON COLUMN studies.pdf_chunks IS 'Pre-processed PDF text chunks with coordinates, sections, and semantic boundaries';