-- Step 1: Handle NULL user_id records in reviewer_configs
-- These appear to be orphaned records that should be removed
DELETE FROM public.reviewer_configs WHERE user_id IS NULL;

-- Step 2: Add NOT NULL constraints to user_id columns
ALTER TABLE public.studies ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.extractions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.ai_reviews ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.extraction_consensus ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.reviewer_configs ALTER COLUMN user_id SET NOT NULL;

-- Step 3: Remove nullable fallbacks from RLS policies

-- Studies table policies
DROP POLICY IF EXISTS "Users can view own studies" ON public.studies;
DROP POLICY IF EXISTS "Users can update own studies" ON public.studies;
DROP POLICY IF EXISTS "Users can delete own studies" ON public.studies;

CREATE POLICY "Users can view own studies" 
ON public.studies 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own studies" 
ON public.studies 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own studies" 
ON public.studies 
FOR DELETE 
USING (auth.uid() = user_id);

-- Extractions table policies
DROP POLICY IF EXISTS "Users can view own extractions" ON public.extractions;
DROP POLICY IF EXISTS "Users can update own extractions" ON public.extractions;
DROP POLICY IF EXISTS "Users can delete own extractions" ON public.extractions;

CREATE POLICY "Users can view own extractions" 
ON public.extractions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own extractions" 
ON public.extractions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own extractions" 
ON public.extractions 
FOR DELETE 
USING (auth.uid() = user_id);

-- AI Reviews table policies
DROP POLICY IF EXISTS "Users can view own ai_reviews" ON public.ai_reviews;
DROP POLICY IF EXISTS "Users can update own ai_reviews" ON public.ai_reviews;
DROP POLICY IF EXISTS "Users can delete own ai_reviews" ON public.ai_reviews;

CREATE POLICY "Users can view own ai_reviews" 
ON public.ai_reviews 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_reviews" 
ON public.ai_reviews 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai_reviews" 
ON public.ai_reviews 
FOR DELETE 
USING (auth.uid() = user_id);

-- Extraction Consensus table policies
DROP POLICY IF EXISTS "Users can view own consensus" ON public.extraction_consensus;
DROP POLICY IF EXISTS "Users can update own consensus" ON public.extraction_consensus;
DROP POLICY IF EXISTS "Users can delete own consensus" ON public.extraction_consensus;

CREATE POLICY "Users can view own consensus" 
ON public.extraction_consensus 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own consensus" 
ON public.extraction_consensus 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own consensus" 
ON public.extraction_consensus 
FOR DELETE 
USING (auth.uid() = user_id);