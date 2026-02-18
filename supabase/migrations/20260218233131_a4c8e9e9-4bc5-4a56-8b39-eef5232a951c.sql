
-- Create businesses table
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  place_id TEXT NOT NULL,
  location TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Public read access (customers need to see business info)
CREATE POLICY "Anyone can view businesses"
  ON public.businesses FOR SELECT
  USING (true);

-- Public insert (add business form, no auth required per plan)
CREATE POLICY "Anyone can add a business"
  ON public.businesses FOR INSERT
  WITH CHECK (true);
