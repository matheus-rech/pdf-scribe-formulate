-- Step 1: Add user_id columns to all tables (allowing NULL initially)
ALTER TABLE public.studies ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.extractions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.ai_reviews ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.extraction_consensus ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.reviewer_configs ADD COLUMN IF NOT EXISTS user_id UUID;

-- Step 2: Backfill user_id from email by matching with auth.users
UPDATE public.studies
SET user_id = auth.users.id
FROM auth.users
WHERE studies.email = auth.users.email
AND studies.user_id IS NULL;

-- For extractions, get user_id from associated study
UPDATE public.extractions
SET user_id = studies.user_id
FROM public.studies
WHERE extractions.study_id = studies.id
AND extractions.user_id IS NULL;

-- For ai_reviews, get user_id from associated extraction
UPDATE public.ai_reviews
SET user_id = extractions.user_id
FROM public.extractions
WHERE ai_reviews.extraction_id = extractions.id
AND ai_reviews.user_id IS NULL;

-- For extraction_consensus, get user_id from associated extraction
UPDATE public.extraction_consensus
SET user_id = extractions.user_id
FROM public.extractions
WHERE extraction_consensus.extraction_id = extractions.id
AND extraction_consensus.user_id IS NULL;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_studies_user_id ON public.studies(user_id);
CREATE INDEX IF NOT EXISTS idx_studies_email ON public.studies(email);
CREATE INDEX IF NOT EXISTS idx_extractions_user_id ON public.extractions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reviews_user_id ON public.ai_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_extraction_consensus_user_id ON public.extraction_consensus(user_id);

-- Step 4: Drop all existing public policies
DROP POLICY IF EXISTS "Allow all access to projects" ON public.studies;
DROP POLICY IF EXISTS "Allow all access to extractions" ON public.extractions;
DROP POLICY IF EXISTS "Allow all access to ai_reviews" ON public.ai_reviews;
DROP POLICY IF EXISTS "Allow all access to extraction_consensus" ON public.extraction_consensus;
DROP POLICY IF EXISTS "Allow all access to reviewer_configs" ON public.reviewer_configs;

-- Step 5: Create secure RLS policies for studies table
-- Allow access if user_id matches OR if user_id is NULL and email matches (for legacy data)
CREATE POLICY "Users can view own studies"
ON public.studies FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  (user_id IS NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

CREATE POLICY "Users can insert own studies"
ON public.studies FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own studies"
ON public.studies FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR 
  (user_id IS NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
)
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own studies"
ON public.studies FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() OR 
  (user_id IS NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Step 6: Create secure RLS policies for extractions table
CREATE POLICY "Users can view own extractions"
ON public.extractions FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  (user_id IS NULL AND EXISTS (
    SELECT 1 FROM public.studies 
    WHERE studies.id = extractions.study_id 
    AND studies.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ))
);

CREATE POLICY "Users can insert own extractions"
ON public.extractions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own extractions"
ON public.extractions FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR
  (user_id IS NULL AND EXISTS (
    SELECT 1 FROM public.studies 
    WHERE studies.id = extractions.study_id 
    AND studies.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ))
)
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own extractions"
ON public.extractions FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() OR
  (user_id IS NULL AND EXISTS (
    SELECT 1 FROM public.studies 
    WHERE studies.id = extractions.study_id 
    AND studies.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ))
);

-- Step 7: Create secure RLS policies for ai_reviews table
CREATE POLICY "Users can view own ai_reviews"
ON public.ai_reviews FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  user_id IS NULL
);

CREATE POLICY "Users can insert own ai_reviews"
ON public.ai_reviews FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ai_reviews"
ON public.ai_reviews FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL)
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own ai_reviews"
ON public.ai_reviews FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

-- Step 8: Create secure RLS policies for extraction_consensus table
CREATE POLICY "Users can view own consensus"
ON public.extraction_consensus FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  user_id IS NULL
);

CREATE POLICY "Users can insert own consensus"
ON public.extraction_consensus FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own consensus"
ON public.extraction_consensus FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL)
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own consensus"
ON public.extraction_consensus FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

-- Step 9: Create secure RLS policies for reviewer_configs table
CREATE POLICY "Authenticated users can view reviewer configs"
ON public.reviewer_configs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage reviewer configs"
ON public.reviewer_configs FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Step 10: Create a function to auto-update user_id when a user signs in
CREATE OR REPLACE FUNCTION public.claim_legacy_studies()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update studies when a user signs in
  UPDATE public.studies
  SET user_id = NEW.id
  WHERE email = NEW.email
  AND user_id IS NULL;
  
  -- Update related extractions
  UPDATE public.extractions
  SET user_id = NEW.id
  FROM public.studies
  WHERE extractions.study_id = studies.id
  AND studies.user_id = NEW.id
  AND extractions.user_id IS NULL;
  
  -- Update related ai_reviews
  UPDATE public.ai_reviews
  SET user_id = NEW.id
  FROM public.extractions
  WHERE ai_reviews.extraction_id = extractions.id
  AND extractions.user_id = NEW.id
  AND ai_reviews.user_id IS NULL;
  
  -- Update related consensus
  UPDATE public.extraction_consensus
  SET user_id = NEW.id
  FROM public.extractions
  WHERE extraction_consensus.extraction_id = extractions.id
  AND extractions.user_id = NEW.id
  AND extraction_consensus.user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Create trigger to claim studies on user sign in
DROP TRIGGER IF EXISTS on_auth_user_created_claim_studies ON auth.users;
CREATE TRIGGER on_auth_user_created_claim_studies
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.claim_legacy_studies();