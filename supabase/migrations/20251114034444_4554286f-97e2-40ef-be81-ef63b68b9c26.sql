-- First, drop ALL triggers on auth.users that we created
DROP TRIGGER IF EXISTS on_auth_user_created_reviewers ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_trigger() CASCADE;

-- Fix the unique constraint issue - name should be unique per user, not globally
ALTER TABLE public.reviewer_configs DROP CONSTRAINT IF EXISTS reviewer_configs_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS reviewer_configs_user_name_key 
  ON public.reviewer_configs (user_id, name);

-- Recreate the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Call the function to create default reviewers
  -- Wrapped in exception handler to prevent signup failures
  BEGIN
    PERFORM public.create_default_reviewers_for_user(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Failed to create default reviewers for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created_reviewers
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_trigger();