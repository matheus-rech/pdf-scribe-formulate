-- Create enum for field types
CREATE TYPE public.field_type AS ENUM (
  'population',
  'intervention',
  'comparator',
  'outcomes',
  'study_design',
  'sample_size',
  'duration',
  'setting',
  'results',
  'conclusions',
  'other'
);

-- Create table to track model accuracy per field type
CREATE TABLE public.model_field_accuracy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  model TEXT NOT NULL,
  field_type public.field_type NOT NULL,
  total_extractions INTEGER NOT NULL DEFAULT 0,
  successful_extractions INTEGER NOT NULL DEFAULT 0,
  accuracy_rate DECIMAL(5,4) GENERATED ALWAYS AS (
    CASE 
      WHEN total_extractions > 0 THEN successful_extractions::DECIMAL / total_extractions::DECIMAL
      ELSE 0
    END
  ) STORED,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_model_field UNIQUE(user_id, model, field_type)
);

-- Enable RLS
ALTER TABLE public.model_field_accuracy ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own accuracy data"
  ON public.model_field_accuracy FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accuracy data"
  ON public.model_field_accuracy FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accuracy data"
  ON public.model_field_accuracy FOR UPDATE
  USING (auth.uid() = user_id);

-- Create prompt templates table
CREATE TABLE public.prompt_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  model_provider TEXT NOT NULL CHECK (model_provider IN ('openai', 'google')),
  template_name TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  extraction_prompt TEXT NOT NULL,
  field_specific_instructions JSONB DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_provider_template UNIQUE(user_id, model_provider, template_name)
);

-- Enable RLS
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own templates"
  ON public.prompt_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
  ON public.prompt_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.prompt_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.prompt_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_prompt_templates_updated_at
  BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates for Gemini (optimized for speed)
INSERT INTO public.prompt_templates (user_id, model_provider, template_name, system_prompt, extraction_prompt, field_specific_instructions, is_default)
SELECT DISTINCT user_id, 'google', 'Fast Extraction', 
  'You are a rapid medical data extractor. Focus on quickly identifying key information with high confidence. Prioritize speed while maintaining accuracy.',
  'Extract the following information from the medical research document. Be concise and precise.',
  jsonb_build_object(
    'population', 'Quickly identify patient demographics, inclusion/exclusion criteria',
    'intervention', 'Rapidly extract treatment details, dosages, administration methods',
    'comparator', 'Swiftly identify control groups or comparison treatments',
    'outcomes', 'Fast extraction of primary and secondary outcomes, metrics',
    'study_design', 'Quick identification of study type, randomization, blinding',
    'sample_size', 'Rapid extraction of participant numbers, groups',
    'duration', 'Fast identification of study timeline, follow-up periods',
    'setting', 'Quick extraction of location, clinical setting',
    'results', 'Rapid identification of key findings, statistics',
    'conclusions', 'Swift extraction of main conclusions, implications'
  ),
  true
FROM public.reviewer_configs
WHERE NOT EXISTS (
  SELECT 1 FROM public.prompt_templates 
  WHERE model_provider = 'google' AND template_name = 'Fast Extraction'
);

-- Insert default templates for OpenAI (optimized for reasoning)
INSERT INTO public.prompt_templates (user_id, model_provider, template_name, system_prompt, extraction_prompt, field_specific_instructions, is_default)
SELECT DISTINCT user_id, 'openai', 'Deep Reasoning', 
  'You are an expert medical research analyst. Apply rigorous reasoning to extract and validate information. Consider context, methodology, and potential biases. Provide detailed analysis.',
  'Carefully analyze the medical research document and extract the following information with thorough reasoning. Explain your confidence level and any ambiguities.',
  jsonb_build_object(
    'population', 'Analyze patient characteristics, consider selection bias, evaluate representativeness',
    'intervention', 'Examine treatment details, assess implementation fidelity, consider variations',
    'comparator', 'Evaluate control conditions, assess appropriateness, identify confounders',
    'outcomes', 'Analyze outcome measures, assess validity and reliability, consider clinical significance',
    'study_design', 'Evaluate methodology rigor, identify potential biases, assess internal validity',
    'sample_size', 'Analyze statistical power, evaluate adequacy for conclusions',
    'duration', 'Assess follow-up appropriateness, consider temporal biases',
    'setting', 'Evaluate ecological validity, generalizability to other contexts',
    'results', 'Critically analyze findings, assess statistical and clinical significance',
    'conclusions', 'Evaluate conclusion validity, identify limitations, assess strength of evidence'
  ),
  true
FROM public.reviewer_configs
WHERE NOT EXISTS (
  SELECT 1 FROM public.prompt_templates 
  WHERE model_provider = 'openai' AND template_name = 'Deep Reasoning'
);

-- Add auto_select_model flag to extraction_settings
ALTER TABLE public.extraction_settings
ADD COLUMN auto_select_model BOOLEAN NOT NULL DEFAULT true;

-- Function to get best model for field type
CREATE OR REPLACE FUNCTION public.get_best_model_for_field(
  p_user_id UUID,
  p_field_type public.field_type,
  p_min_extractions INTEGER DEFAULT 10
)
RETURNS TABLE (
  model TEXT,
  accuracy_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mfa.model,
    mfa.accuracy_rate
  FROM public.model_field_accuracy mfa
  WHERE mfa.user_id = p_user_id
    AND mfa.field_type = p_field_type
    AND mfa.total_extractions >= p_min_extractions
  ORDER BY mfa.accuracy_rate DESC, mfa.total_extractions DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON TABLE public.model_field_accuracy IS 'Tracks historical accuracy of models per field type for automatic model selection';
COMMENT ON TABLE public.prompt_templates IS 'Stores model-specific prompt templates optimized for each AI provider';
COMMENT ON FUNCTION public.get_best_model_for_field IS 'Returns the best performing model for a specific field type based on historical accuracy';