-- Add new columns to extractions table for enhanced features
ALTER TABLE extractions ADD COLUMN IF NOT EXISTS region JSONB;
ALTER TABLE extractions ADD COLUMN IF NOT EXISTS validation_status TEXT;
ALTER TABLE extractions ADD COLUMN IF NOT EXISTS confidence_score FLOAT;

-- Add index for faster queries on validation status
CREATE INDEX IF NOT EXISTS idx_extractions_validation ON extractions(validation_status);

COMMENT ON COLUMN extractions.region IS 'Stores region coordinates for region-based extractions';
COMMENT ON COLUMN extractions.validation_status IS 'Validation status: validated, questionable, pending, or NULL';
COMMENT ON COLUMN extractions.confidence_score IS 'AI validation confidence score (0.0 to 1.0)';