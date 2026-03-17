
-- Create incidents table
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_name TEXT NOT NULL,
  coordinator TEXT NOT NULL,
  problem_type TEXT NOT NULL,
  urgency TEXT NOT NULL,
  description TEXT NOT NULL,
  solution TEXT NOT NULL DEFAULT '',
  needs_follow_up BOOLEAN NOT NULL DEFAULT false,
  resolved BOOLEAN NOT NULL DEFAULT false,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth in this app)
CREATE POLICY "Anyone can read incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Anyone can insert incidents" ON public.incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update incidents" ON public.incidents FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete incidents" ON public.incidents FOR DELETE USING (true);

-- Index for common queries
CREATE INDEX idx_incidents_created_at ON public.incidents (created_at DESC);
CREATE INDEX idx_incidents_needs_follow_up ON public.incidents (needs_follow_up) WHERE needs_follow_up = true AND resolved = false;
