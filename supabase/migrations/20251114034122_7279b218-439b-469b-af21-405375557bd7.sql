-- Drop the old trigger and function that's causing the error
DROP TRIGGER IF EXISTS on_auth_user_created_reviewers ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_reviewers();

-- Create a trigger wrapper function that calls create_default_reviewers_for_user
CREATE OR REPLACE FUNCTION public.handle_new_user_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM public.create_default_reviewers_for_user(NEW.id);
  RETURN NEW;
END;
$$;

-- Create the trigger to initialize default reviewers for new users
CREATE TRIGGER on_auth_user_created_reviewers
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_trigger();