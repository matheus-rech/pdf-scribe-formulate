-- Create table for storing extracted figures
CREATE TABLE IF NOT EXISTS public.pdf_figures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  study_id uuid NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  page_number integer NOT NULL,
  figure_id text NOT NULL,
  data_url text NOT NULL,
  width integer NOT NULL,
  height integer NOT NULL,
  extraction_method text NOT NULL,
  color_space integer,
  has_alpha boolean DEFAULT false,
  data_length integer,
  caption text,
  ai_enhanced boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdf_figures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own figures"
  ON public.pdf_figures
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own figures"
  ON public.pdf_figures
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own figures"
  ON public.pdf_figures
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own figures"
  ON public.pdf_figures
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_pdf_figures_study_id ON public.pdf_figures(study_id);
CREATE INDEX idx_pdf_figures_user_id ON public.pdf_figures(user_id);
CREATE INDEX idx_pdf_figures_page_number ON public.pdf_figures(page_number);

-- Add trigger for updated_at
CREATE TRIGGER update_pdf_figures_updated_at
  BEFORE UPDATE ON public.pdf_figures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();