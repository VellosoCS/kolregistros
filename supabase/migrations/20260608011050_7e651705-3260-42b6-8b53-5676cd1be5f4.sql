
-- 1) teacher_tracking
CREATE TABLE public.teacher_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_name TEXT NOT NULL UNIQUE,
  first_message_sent BOOLEAN NOT NULL DEFAULT false,
  first_message_date DATE,
  problem_resolved BOOLEAN NOT NULL DEFAULT false,
  second_message_sent BOOLEAN NOT NULL DEFAULT false,
  second_message_date DATE,
  next_message_due DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_tracking TO authenticated;
GRANT ALL ON public.teacher_tracking TO service_role;

ALTER TABLE public.teacher_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acompanhamento staff can read teacher tracking"
ON public.teacher_tracking FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'coordenacao')
  OR public.has_role(auth.uid(), 'suporte')
  OR public.has_role(auth.uid(), 'suporte_aluno')
);

CREATE POLICY "Acompanhamento staff can insert teacher tracking"
ON public.teacher_tracking FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'coordenacao')
  OR public.has_role(auth.uid(), 'suporte')
  OR public.has_role(auth.uid(), 'suporte_aluno')
);

CREATE POLICY "Acompanhamento staff can update teacher tracking"
ON public.teacher_tracking FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'coordenacao')
  OR public.has_role(auth.uid(), 'suporte')
  OR public.has_role(auth.uid(), 'suporte_aluno')
);

CREATE POLICY "Coordenacao can delete teacher tracking"
ON public.teacher_tracking FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'coordenacao'));

-- 2) teacher_meetings
CREATE TABLE public.teacher_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teacher_tracking(id) ON DELETE CASCADE,
  coordinator_id UUID,
  coordinator_name TEXT NOT NULL,
  meeting_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_meetings TO authenticated;
GRANT ALL ON public.teacher_meetings TO service_role;

ALTER TABLE public.teacher_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acompanhamento staff can read meetings"
ON public.teacher_meetings FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'coordenacao')
  OR public.has_role(auth.uid(), 'suporte')
  OR public.has_role(auth.uid(), 'suporte_aluno')
);

CREATE POLICY "Acompanhamento staff can insert meetings"
ON public.teacher_meetings FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'coordenacao')
  OR public.has_role(auth.uid(), 'suporte')
  OR public.has_role(auth.uid(), 'suporte_aluno')
);

CREATE POLICY "Acompanhamento staff can update meetings"
ON public.teacher_meetings FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'coordenacao')
  OR public.has_role(auth.uid(), 'suporte')
  OR public.has_role(auth.uid(), 'suporte_aluno')
);

CREATE POLICY "Coordenacao can delete meetings"
ON public.teacher_meetings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'coordenacao'));

-- 3) updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_teacher_tracking_updated_at
BEFORE UPDATE ON public.teacher_tracking
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Auto-calc next_message_due whenever message flags/dates change
CREATE OR REPLACE FUNCTION public.compute_next_message_due()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.problem_resolved THEN
    NEW.next_message_due := NULL;
  ELSIF NEW.second_message_sent AND NEW.second_message_date IS NOT NULL THEN
    NEW.next_message_due := NEW.second_message_date + INTERVAL '7 days';
  ELSIF NEW.first_message_sent AND NEW.first_message_date IS NOT NULL THEN
    NEW.next_message_due := NEW.first_message_date + INTERVAL '7 days';
  ELSE
    NEW.next_message_due := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER teacher_tracking_compute_due
BEFORE INSERT OR UPDATE ON public.teacher_tracking
FOR EACH ROW EXECUTE FUNCTION public.compute_next_message_due();

-- 5) Auto-create teacher profile on new Controle Interno incident
CREATE OR REPLACE FUNCTION public.upsert_teacher_from_incident()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.incident_mode = 'interno' AND NEW.teacher_name IS NOT NULL AND TRIM(NEW.teacher_name) <> '' THEN
    INSERT INTO public.teacher_tracking (teacher_name)
    VALUES (TRIM(NEW.teacher_name))
    ON CONFLICT (teacher_name) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER incidents_upsert_teacher
AFTER INSERT ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.upsert_teacher_from_incident();

-- 6) Backfill existing teachers from prior Controle Interno incidents
INSERT INTO public.teacher_tracking (teacher_name)
SELECT DISTINCT TRIM(teacher_name)
FROM public.incidents
WHERE incident_mode = 'interno'
  AND teacher_name IS NOT NULL
  AND TRIM(teacher_name) <> ''
ON CONFLICT (teacher_name) DO NOTHING;
