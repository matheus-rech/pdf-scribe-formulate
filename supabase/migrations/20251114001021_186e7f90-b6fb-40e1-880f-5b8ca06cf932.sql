-- Function to create default reviewers for a user
CREATE OR REPLACE FUNCTION public.create_default_reviewers_for_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user already has reviewers
  IF EXISTS (SELECT 1 FROM public.reviewer_configs WHERE user_id = target_user_id) THEN
    RETURN;
  END IF;

  -- Insert 8 default reviewers with different strategies and models
  INSERT INTO public.reviewer_configs (user_id, name, model, temperature, prompt_strategy, system_prompt, priority, enabled) VALUES
  (
    target_user_id,
    'Conservative Validator',
    'google/gemini-2.5-pro',
    0.3,
    'conservative',
    'You are a meticulous medical research data extractor. Prioritize accuracy over completeness. Only extract information you are highly confident about. When in doubt, indicate uncertainty rather than guessing.',
    1,
    true
  ),
  (
    target_user_id,
    'Balanced Extractor',
    'google/gemini-2.5-flash',
    0.7,
    'balanced',
    'You are an experienced clinical study data extractor. Balance accuracy with completeness. Extract all relevant information while maintaining high confidence in your extractions.',
    2,
    true
  ),
  (
    target_user_id,
    'Comprehensive Analyzer',
    'openai/gpt-5-mini',
    0.9,
    'comprehensive',
    'You are a comprehensive medical literature analyzer. Extract all potentially relevant information, even if confidence is moderate. Provide detailed reasoning for your extractions.',
    3,
    true
  ),
  (
    target_user_id,
    'Conservative Reviewer Pro',
    'google/gemini-2.5-pro',
    0.4,
    'conservative',
    'You are a critical evaluator of medical research data. Question assumptions and verify consistency. Flag potential errors or ambiguities in the source material.',
    4,
    true
  ),
  (
    target_user_id,
    'Balanced Extractor Mini',
    'openai/gpt-5-mini',
    0.7,
    'balanced',
    'You are a context-aware clinical study extractor. Consider the broader context of the study when extracting data. Understand relationships between different data points.',
    5,
    true
  ),
  (
    target_user_id,
    'Comprehensive Flash',
    'google/gemini-2.5-flash',
    0.8,
    'comprehensive',
    'You are a methodological reviewer specializing in study design and methodology. Extract data related to study methods, participant selection, and statistical approaches with care.',
    6,
    true
  ),
  (
    target_user_id,
    'Fast Scanner Lite',
    'google/gemini-2.5-flash-lite',
    0.6,
    'fast',
    'You are a fast medical data scanner. Quickly identify and extract key information. Prioritize speed while maintaining reasonable accuracy.',
    7,
    true
  ),
  (
    target_user_id,
    'Fast Balanced',
    'google/gemini-2.5-flash',
    0.5,
    'fast',
    'You are a detail-oriented medical data reviewer. Focus on extracting specific numerical values, dates, and measurements with high precision. Verify units and formats.',
    8,
    true
  );
END;
$$;

-- Trigger function to create reviewers on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_reviewers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default reviewers for the new user
  PERFORM public.create_default_reviewers_for_user(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_reviewers'
  ) THEN
    CREATE TRIGGER on_auth_user_created_reviewers
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user_reviewers();
  END IF;
END
$$;

-- Create default reviewers for all existing users who don't have any
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    PERFORM public.create_default_reviewers_for_user(user_record.id);
  END LOOP;
END
$$;