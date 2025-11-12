-- Create enum for AI model providers
CREATE TYPE public.ai_provider AS ENUM ('google/gemini-2.5-pro', 'google/gemini-2.5-flash', 'google/gemini-2.5-flash-lite', 'openai/gpt-5', 'openai/gpt-5-mini', 'openai/gpt-5-nano');

-- Create enum for review strategies
CREATE TYPE public.review_strategy AS ENUM ('conservative', 'balanced', 'comprehensive', 'fast');

-- Create enum for conflict types
CREATE TYPE public.conflict_type AS ENUM ('value_disagreement', 'confidence_variance', 'split_vote', 'outlier_detected');

-- Create enum for human review status
CREATE TYPE public.review_status AS ENUM ('pending', 'in_progress', 'resolved', 'escalated');

-- Create reviewer_configs table
CREATE TABLE public.reviewer_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  model ai_provider NOT NULL,
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.7,
  prompt_strategy review_strategy NOT NULL,
  system_prompt TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_reviews table
CREATE TABLE public.ai_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_id UUID REFERENCES public.extractions(id) ON DELETE CASCADE NOT NULL,
  reviewer_config_id UUID REFERENCES public.reviewer_configs(id) ON DELETE CASCADE NOT NULL,
  field_name TEXT NOT NULL,
  extracted_value TEXT,
  confidence_score DECIMAL(5,2) NOT NULL,
  reasoning TEXT,
  source_section TEXT,
  source_text TEXT,
  source_page INTEGER,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create extraction_consensus table
CREATE TABLE public.extraction_consensus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_id UUID REFERENCES public.extractions(id) ON DELETE CASCADE NOT NULL,
  field_name TEXT NOT NULL,
  consensus_value TEXT,
  agreement_level DECIMAL(5,2) NOT NULL, -- 0-100%
  total_reviewers INTEGER NOT NULL,
  agreeing_reviewers INTEGER NOT NULL,
  conflict_detected BOOLEAN NOT NULL DEFAULT false,
  conflict_types conflict_type[],
  requires_human_review BOOLEAN NOT NULL DEFAULT false,
  human_review_status review_status DEFAULT 'pending',
  human_resolved_value TEXT,
  human_resolved_by UUID,
  human_resolved_at TIMESTAMP WITH TIME ZONE,
  human_resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(extraction_id, field_name)
);

-- Enable RLS
ALTER TABLE public.reviewer_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_consensus ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all access for now (can be restricted later)
CREATE POLICY "Allow all access to reviewer_configs" ON public.reviewer_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to ai_reviews" ON public.ai_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to extraction_consensus" ON public.extraction_consensus FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger for reviewer_configs
CREATE TRIGGER update_reviewer_configs_updated_at
  BEFORE UPDATE ON public.reviewer_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for extraction_consensus
CREATE TRIGGER update_extraction_consensus_updated_at
  BEFORE UPDATE ON public.extraction_consensus
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_ai_reviews_extraction_id ON public.ai_reviews(extraction_id);
CREATE INDEX idx_ai_reviews_reviewer_config_id ON public.ai_reviews(reviewer_config_id);
CREATE INDEX idx_extraction_consensus_extraction_id ON public.extraction_consensus(extraction_id);
CREATE INDEX idx_extraction_consensus_requires_review ON public.extraction_consensus(requires_human_review);
CREATE INDEX idx_extraction_consensus_status ON public.extraction_consensus(human_review_status);

-- Insert default reviewer configurations
INSERT INTO public.reviewer_configs (name, model, temperature, prompt_strategy, system_prompt, priority) VALUES
(
  'Conservative Validator',
  'google/gemini-2.5-pro',
  0.3,
  'conservative',
  'You are a meticulous medical research data extractor. Prioritize accuracy over completeness. Only extract data you are highly confident about. If uncertain, indicate low confidence. Cross-reference all numeric values carefully.',
  1
),
(
  'Balanced Extractor',
  'google/gemini-2.5-flash',
  0.7,
  'balanced',
  'You are an experienced clinical study data extractor. Balance thoroughness with accuracy. Extract all available data while maintaining quality standards. Provide reasoning for your confidence scores.',
  2
),
(
  'Comprehensive Analyzer',
  'openai/gpt-5-mini',
  0.9,
  'comprehensive',
  'You are a comprehensive medical literature analyzer. Extract all possible data points, including implicit information. Use contextual clues to fill gaps. Mark assumptions clearly and provide detailed reasoning.',
  3
);