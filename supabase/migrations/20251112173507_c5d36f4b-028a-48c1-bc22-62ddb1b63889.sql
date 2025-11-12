-- Add source_citations column to extractions table
ALTER TABLE extractions 
ADD COLUMN source_citations JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance
CREATE INDEX idx_extractions_source_citations 
ON extractions USING GIN (source_citations);

-- Add comment
COMMENT ON COLUMN extractions.source_citations IS 'Array of source citation objects linking to original PDF text';