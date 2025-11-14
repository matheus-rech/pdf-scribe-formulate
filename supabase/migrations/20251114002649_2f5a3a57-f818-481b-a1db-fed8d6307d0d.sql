-- Phase 1: Extend reviewer_configs table with new parameters
ALTER TABLE public.reviewer_configs 
ADD COLUMN IF NOT EXISTS seed integer,
ADD COLUMN IF NOT EXISTS max_tokens integer DEFAULT 4000,
ADD COLUMN IF NOT EXISTS reasoning_effort text,
ADD COLUMN IF NOT EXISTS custom_parameters jsonb;

-- Phase 1: Create extraction_settings table
CREATE TABLE IF NOT EXISTS public.extraction_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  min_reviewers integer NOT NULL DEFAULT 2,
  max_reviewers integer NOT NULL DEFAULT 8,
  default_reviewers integer NOT NULL DEFAULT 3,
  high_concordance_threshold_even numeric NOT NULL DEFAULT 0.80,
  high_concordance_threshold_odd numeric NOT NULL DEFAULT 0.75,
  auto_accept_high_concordance boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on extraction_settings
ALTER TABLE public.extraction_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for extraction_settings
CREATE POLICY "Users can view own extraction settings"
ON public.extraction_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own extraction settings"
ON public.extraction_settings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own extraction settings"
ON public.extraction_settings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own extraction settings"
ON public.extraction_settings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_extraction_settings_updated_at
BEFORE UPDATE ON public.extraction_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create default settings for existing users
INSERT INTO public.extraction_settings (user_id)
SELECT DISTINCT user_id 
FROM public.reviewer_configs 
WHERE NOT EXISTS (
  SELECT 1 FROM public.extraction_settings es 
  WHERE es.user_id = reviewer_configs.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- Add comments for documentation
COMMENT ON COLUMN public.reviewer_configs.seed IS 'Random seed for reproducible results. Leave null for random behavior.';
COMMENT ON COLUMN public.reviewer_configs.max_tokens IS 'Maximum tokens for model response. Default 4000.';
COMMENT ON COLUMN public.reviewer_configs.reasoning_effort IS 'For reasoning models (o1/o3): low, medium, or high. Controls depth of reasoning.';
COMMENT ON COLUMN public.reviewer_configs.custom_parameters IS 'JSON object for model-specific parameters not covered by other fields.';
COMMENT ON TABLE public.extraction_settings IS 'User-specific settings for multi-agent extraction consensus rules.';
COMMENT ON COLUMN public.extraction_settings.high_concordance_threshold_even IS 'Agreement threshold for even number of reviewers (e.g., 0.80 = 80%).';
COMMENT ON COLUMN public.extraction_settings.high_concordance_threshold_odd IS 'Agreement threshold for odd number of reviewers (e.g., 0.75 = 75%).';