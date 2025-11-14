-- Create pdf_text_chunks table for precise citation tracking
CREATE TABLE public.pdf_text_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Chunk identification
  chunk_index INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  
  -- Text content
  text TEXT NOT NULL,
  sentence_count INTEGER NOT NULL DEFAULT 1,
  
  -- Precise coordinates (PDF space)
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL NOT NULL,
  height REAL NOT NULL,
  
  -- Character position context
  char_start INTEGER NOT NULL,
  char_end INTEGER NOT NULL,
  section_name TEXT,
  
  -- Font metadata for classification
  font_name TEXT,
  font_size REAL,
  is_heading BOOLEAN DEFAULT false,
  is_bold BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Uniqueness: one chunk index per study
  CONSTRAINT unique_study_chunk UNIQUE(study_id, chunk_index)
);

-- Enable RLS
ALTER TABLE public.pdf_text_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own text chunks"
  ON public.pdf_text_chunks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own text chunks"
  ON public.pdf_text_chunks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own text chunks"
  ON public.pdf_text_chunks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own text chunks"
  ON public.pdf_text_chunks
  FOR DELETE
  USING (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX idx_text_chunks_study_id ON public.pdf_text_chunks(study_id);
CREATE INDEX idx_text_chunks_chunk_index ON public.pdf_text_chunks(chunk_index);
CREATE INDEX idx_text_chunks_page_number ON public.pdf_text_chunks(page_number);
CREATE INDEX idx_text_chunks_section ON public.pdf_text_chunks(section_name);

-- Add source_citations column to extractions table if not exists
ALTER TABLE public.extractions 
  ADD COLUMN IF NOT EXISTS source_citations JSONB DEFAULT '{"chunk_indices": [], "source_quote": "", "confidence": 0}'::jsonb;