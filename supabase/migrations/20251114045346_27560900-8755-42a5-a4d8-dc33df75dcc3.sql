-- Add coordinate fields to pdf_figures table for accurate bounding box rendering
ALTER TABLE public.pdf_figures
ADD COLUMN IF NOT EXISTS x REAL,
ADD COLUMN IF NOT EXISTS y REAL,
ADD COLUMN IF NOT EXISTS bbox_width REAL,
ADD COLUMN IF NOT EXISTS bbox_height REAL;

COMMENT ON COLUMN public.pdf_figures.x IS 'X coordinate of figure in PDF coordinate space';
COMMENT ON COLUMN public.pdf_figures.y IS 'Y coordinate of figure in PDF coordinate space';
COMMENT ON COLUMN public.pdf_figures.bbox_width IS 'Width of figure bounding box in PDF coordinate space';
COMMENT ON COLUMN public.pdf_figures.bbox_height IS 'Height of figure bounding box in PDF coordinate space';