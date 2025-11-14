-- Add page_annotations column to studies table for persisting PDF annotations
ALTER TABLE public.studies
ADD COLUMN page_annotations JSONB DEFAULT '[]'::jsonb;