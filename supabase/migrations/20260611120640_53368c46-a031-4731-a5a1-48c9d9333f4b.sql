CREATE TABLE public.teacher_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.teacher_tracking(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.teacher_notes TO authenticated;
GRANT ALL ON public.teacher_notes TO service_role;

ALTER TABLE public.teacher_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage teacher notes"
ON public.teacher_notes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
