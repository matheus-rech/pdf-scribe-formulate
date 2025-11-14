-- Fix the handle_new_user_reviewers function to handle duplicate configs
CREATE OR REPLACE FUNCTION public.handle_new_user_reviewers()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert default reviewer config, skip if already exists
  INSERT INTO public.reviewer_configs (name, reviewer_count, user_id)
  VALUES ('Default', 2, NEW.id)
  ON CONFLICT (name, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;