-- Create study_extractions table for storing PDF extraction data
CREATE TABLE IF NOT EXISTS public.study_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  study_id TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  annotations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create pdf_annotations table for storing annotations
CREATE TABLE IF NOT EXISTS public.pdf_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  study_id TEXT,
  page_number INTEGER NOT NULL,
  type TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_annotations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for study_extractions
CREATE POLICY "Users can view their own extractions"
  ON public.study_extractions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own extractions"
  ON public.study_extractions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extractions"
  ON public.study_extractions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own extractions"
  ON public.study_extractions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for pdf_annotations
CREATE POLICY "Users can view their own annotations"
  ON public.pdf_annotations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own annotations"
  ON public.pdf_annotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own annotations"
  ON public.pdf_annotations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations"
  ON public.pdf_annotations FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_study_extractions_user_id ON public.study_extractions(user_id);
CREATE INDEX idx_study_extractions_study_id ON public.study_extractions(study_id);
CREATE INDEX idx_pdf_annotations_user_id ON public.pdf_annotations(user_id);
CREATE INDEX idx_pdf_annotations_study_id ON public.pdf_annotations(study_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_study_extractions_updated_at
  BEFORE UPDATE ON public.study_extractions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pdf_annotations_updated_at
  BEFORE UPDATE ON public.pdf_annotations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();