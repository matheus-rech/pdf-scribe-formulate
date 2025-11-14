-- Create pdf_tables table for storing extracted tables
CREATE TABLE public.pdf_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Identification
  table_id TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  
  -- Position and coordinates
  x REAL,
  y REAL,
  bbox_width REAL,
  bbox_height REAL,
  
  -- Table structure
  headers JSONB NOT NULL,
  rows JSONB NOT NULL,
  column_count INTEGER NOT NULL,
  row_count INTEGER NOT NULL,
  column_positions JSONB,
  
  -- Metadata
  title TEXT,
  caption TEXT,
  extraction_method TEXT NOT NULL,
  ai_enhanced BOOLEAN DEFAULT false,
  confidence_score REAL,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pdf_tables ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own tables"
  ON public.pdf_tables
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tables"
  ON public.pdf_tables
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tables"
  ON public.pdf_tables
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tables"
  ON public.pdf_tables
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_pdf_tables_study_id ON public.pdf_tables(study_id);
CREATE INDEX idx_pdf_tables_page ON public.pdf_tables(study_id, page_number);
CREATE INDEX idx_pdf_tables_user ON public.pdf_tables(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_pdf_tables_updated_at
  BEFORE UPDATE ON public.pdf_tables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();