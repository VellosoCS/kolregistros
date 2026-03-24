
CREATE TABLE public.incident_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  author text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments" ON public.incident_comments FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert comments" ON public.incident_comments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can delete comments" ON public.incident_comments FOR DELETE TO public USING (true);
