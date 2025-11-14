-- Create enum for test status
CREATE TYPE public.ab_test_status AS ENUM (
  'draft',
  'running',
  'paused',
  'completed',
  'winner_selected'
);

-- Create enum for test metric types
CREATE TYPE public.test_metric AS ENUM (
  'accuracy',
  'confidence',
  'speed',
  'cost',
  'agreement_rate'
);

-- A/B test configurations table
CREATE TABLE public.ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status public.ab_test_status NOT NULL DEFAULT 'draft',
  field_types public.field_type[] NOT NULL,
  primary_metric public.test_metric NOT NULL DEFAULT 'accuracy',
  traffic_split DECIMAL(3,2) NOT NULL DEFAULT 0.50 CHECK (traffic_split > 0 AND traffic_split < 1),
  min_sample_size INTEGER NOT NULL DEFAULT 30,
  confidence_level DECIMAL(3,2) NOT NULL DEFAULT 0.95,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  winner_variant TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test variants (A/B or multivariate)
CREATE TABLE public.ab_test_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_template_id UUID REFERENCES public.prompt_templates(id),
  temperature DECIMAL(3,2),
  max_tokens INTEGER,
  seed INTEGER,
  reasoning_effort TEXT,
  custom_parameters JSONB,
  is_control BOOLEAN NOT NULL DEFAULT false,
  traffic_allocation DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_test_variant UNIQUE(test_id, variant_name)
);

-- Test results tracking
CREATE TABLE public.ab_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.ab_test_variants(id) ON DELETE CASCADE,
  extraction_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  field_type public.field_type NOT NULL,
  extracted_value TEXT,
  confidence_score DECIMAL(5,4),
  processing_time_ms INTEGER,
  was_correct BOOLEAN,
  human_verified BOOLEAN NOT NULL DEFAULT false,
  human_verified_at TIMESTAMP WITH TIME ZONE,
  human_verified_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Test statistics (aggregated metrics)
CREATE TABLE public.ab_test_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.ab_test_variants(id) ON DELETE CASCADE,
  sample_size INTEGER NOT NULL DEFAULT 0,
  accuracy_rate DECIMAL(5,4),
  avg_confidence DECIMAL(5,4),
  avg_processing_time_ms INTEGER,
  avg_cost DECIMAL(8,4),
  agreement_rate DECIMAL(5,4),
  statistical_significance DECIMAL(5,4),
  is_significant BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_test_variant_stats UNIQUE(test_id, variant_id)
);

-- Enable RLS
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ab_tests
CREATE POLICY "Users can view own ab_tests"
  ON public.ab_tests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ab_tests"
  ON public.ab_tests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ab_tests"
  ON public.ab_tests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ab_tests"
  ON public.ab_tests FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ab_test_variants
CREATE POLICY "Users can view variants of own tests"
  ON public.ab_test_variants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ab_tests 
    WHERE ab_tests.id = ab_test_variants.test_id 
    AND ab_tests.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert variants for own tests"
  ON public.ab_test_variants FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ab_tests 
    WHERE ab_tests.id = ab_test_variants.test_id 
    AND ab_tests.user_id = auth.uid()
  ));

CREATE POLICY "Users can update variants of own tests"
  ON public.ab_test_variants FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.ab_tests 
    WHERE ab_tests.id = ab_test_variants.test_id 
    AND ab_tests.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete variants of own tests"
  ON public.ab_test_variants FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.ab_tests 
    WHERE ab_tests.id = ab_test_variants.test_id 
    AND ab_tests.user_id = auth.uid()
  ));

-- RLS Policies for ab_test_results
CREATE POLICY "Users can view results of own tests"
  ON public.ab_test_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ab_tests 
    WHERE ab_tests.id = ab_test_results.test_id 
    AND ab_tests.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert results for own tests"
  ON public.ab_test_results FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ab_tests 
    WHERE ab_tests.id = ab_test_results.test_id 
    AND ab_tests.user_id = auth.uid()
  ));

CREATE POLICY "Users can update results of own tests"
  ON public.ab_test_results FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.ab_tests 
    WHERE ab_tests.id = ab_test_results.test_id 
    AND ab_tests.user_id = auth.uid()
  ));

-- RLS Policies for ab_test_stats
CREATE POLICY "Users can view stats of own tests"
  ON public.ab_test_stats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ab_tests 
    WHERE ab_tests.id = ab_test_stats.test_id 
    AND ab_tests.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert stats for own tests"
  ON public.ab_test_stats FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ab_tests 
    WHERE ab_tests.id = ab_test_stats.test_id 
    AND ab_tests.user_id = auth.uid()
  ));

CREATE POLICY "Users can update stats of own tests"
  ON public.ab_test_stats FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.ab_tests 
    WHERE ab_tests.id = ab_test_stats.test_id 
    AND ab_tests.user_id = auth.uid()
  ));

-- Triggers
CREATE TRIGGER update_ab_tests_updated_at
  BEFORE UPDATE ON public.ab_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ab_test_stats_updated_at
  BEFORE UPDATE ON public.ab_test_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate statistical significance (two-proportion z-test)
CREATE OR REPLACE FUNCTION public.calculate_ab_test_significance(
  p_test_id UUID
)
RETURNS TABLE (
  variant_id UUID,
  variant_name TEXT,
  sample_size INTEGER,
  success_rate DECIMAL,
  z_score DECIMAL,
  p_value DECIMAL,
  is_significant BOOLEAN
) AS $$
DECLARE
  control_rate DECIMAL;
  control_n INTEGER;
BEGIN
  -- Get control variant stats
  SELECT 
    accuracy_rate,
    sample_size
  INTO control_rate, control_n
  FROM public.ab_test_stats ats
  JOIN public.ab_test_variants atv ON ats.variant_id = atv.id
  WHERE ats.test_id = p_test_id
    AND atv.is_control = true
  LIMIT 1;

  -- Calculate significance for each variant vs control
  RETURN QUERY
  SELECT 
    ats.variant_id,
    atv.variant_name,
    ats.sample_size,
    ats.accuracy_rate,
    CASE 
      WHEN ats.sample_size > 0 AND control_n > 0 THEN
        (ats.accuracy_rate - control_rate) / 
        SQRT((control_rate * (1 - control_rate) / control_n) + 
             (ats.accuracy_rate * (1 - ats.accuracy_rate) / ats.sample_size))
      ELSE 0
    END AS z_score,
    CASE 
      WHEN ats.sample_size > 0 AND control_n > 0 THEN
        2 * (1 - 0.5 * (1 + SIGN(ABS((ats.accuracy_rate - control_rate) / 
          SQRT((control_rate * (1 - control_rate) / control_n) + 
               (ats.accuracy_rate * (1 - ats.accuracy_rate) / ats.sample_size))))))
      ELSE 1
    END AS p_value,
    (ats.sample_size > 0 AND control_n > 0 AND
     ABS((ats.accuracy_rate - control_rate) / 
       SQRT((control_rate * (1 - control_rate) / control_n) + 
            (ats.accuracy_rate * (1 - ats.accuracy_rate) / ats.sample_size))) > 1.96) AS is_significant
  FROM public.ab_test_stats ats
  JOIN public.ab_test_variants atv ON ats.variant_id = atv.id
  WHERE ats.test_id = p_test_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update test statistics
CREATE OR REPLACE FUNCTION public.update_ab_test_statistics(p_test_id UUID)
RETURNS void AS $$
BEGIN
  -- Update aggregated statistics for each variant
  INSERT INTO public.ab_test_stats (test_id, variant_id, sample_size, accuracy_rate, avg_confidence, avg_processing_time_ms, agreement_rate)
  SELECT 
    p_test_id,
    variant_id,
    COUNT(*) as sample_size,
    AVG(CASE WHEN was_correct THEN 1.0 ELSE 0.0 END) as accuracy_rate,
    AVG(confidence_score) as avg_confidence,
    AVG(processing_time_ms) as avg_processing_time_ms,
    AVG(CASE WHEN was_correct THEN 1.0 ELSE 0.0 END) as agreement_rate
  FROM public.ab_test_results
  WHERE test_id = p_test_id
    AND human_verified = true
  GROUP BY variant_id
  ON CONFLICT (test_id, variant_id) 
  DO UPDATE SET
    sample_size = EXCLUDED.sample_size,
    accuracy_rate = EXCLUDED.accuracy_rate,
    avg_confidence = EXCLUDED.avg_confidence,
    avg_processing_time_ms = EXCLUDED.avg_processing_time_ms,
    agreement_rate = EXCLUDED.agreement_rate,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON TABLE public.ab_tests IS 'A/B test configurations for optimizing model and prompt performance';
COMMENT ON TABLE public.ab_test_variants IS 'Different variants being tested in an A/B test';
COMMENT ON TABLE public.ab_test_results IS 'Individual extraction results for each test variant';
COMMENT ON TABLE public.ab_test_stats IS 'Aggregated statistics for test variant performance';
COMMENT ON FUNCTION public.calculate_ab_test_significance IS 'Calculates statistical significance using two-proportion z-test';
COMMENT ON FUNCTION public.update_ab_test_statistics IS 'Updates aggregated statistics for all variants in a test';