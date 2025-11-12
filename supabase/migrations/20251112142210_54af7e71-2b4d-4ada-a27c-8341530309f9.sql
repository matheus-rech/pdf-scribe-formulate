-- Create projects table with email-based identification
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  pdf_name TEXT,
  total_pages INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create extractions table
CREATE TABLE public.extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  extraction_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  text TEXT,
  page INTEGER,
  coordinates JSONB,
  method TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  image_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extractions ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies for single-user access
CREATE POLICY "Allow all access to projects"
  ON public.projects
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to extractions"
  ON public.extractions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_projects_email ON public.projects(email);
CREATE INDEX idx_extractions_project_id ON public.extractions(project_id);
CREATE INDEX idx_extractions_field_name ON public.extractions(field_name);