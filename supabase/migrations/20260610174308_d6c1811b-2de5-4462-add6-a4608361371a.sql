
-- 1) Add new columns to teacher_tracking
ALTER TABLE public.teacher_tracking
  ADD COLUMN IF NOT EXISTS recurrence_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_recurrence_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Backfill resolved_at for teachers already marked resolved
UPDATE public.teacher_tracking
SET resolved_at = COALESCE(updated_at, now())
WHERE problem_resolved = true AND resolved_at IS NULL;

-- 2) New table: teacher_recurrences (history)
CREATE TABLE IF NOT EXISTS public.teacher_recurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teacher_tracking(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL CHECK (source IN ('incident', 'manual')),
  incident_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teacher_recurrences_teacher_idx ON public.teacher_recurrences(teacher_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_recurrences TO authenticated;
GRANT ALL ON public.teacher_recurrences TO service_role;

ALTER TABLE public.teacher_recurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view recurrences"
  ON public.teacher_recurrences FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert recurrences"
  ON public.teacher_recurrences FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can delete recurrences"
  ON public.teacher_recurrences FOR DELETE
  TO authenticated USING (true);

-- 3) Trigger on teacher_tracking: track resolved_at and manual recurrence
CREATE OR REPLACE FUNCTION public.track_resolution_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- false -> true: just resolved
    IF NEW.problem_resolved = true AND COALESCE(OLD.problem_resolved, false) = false THEN
      NEW.resolved_at := now();
    END IF;

    -- true -> false: manual reopen = recurrence
    IF NEW.problem_resolved = false AND COALESCE(OLD.problem_resolved, false) = true THEN
      NEW.recurrence_count := COALESCE(OLD.recurrence_count, 0) + 1;
      NEW.last_recurrence_at := now();
      NEW.resolved_at := NULL;
      NEW.first_message_sent := false;
      NEW.first_message_date := NULL;
      NEW.second_message_sent := false;
      NEW.second_message_date := NULL;
      NEW.message_stage := 1;
      NEW.next_message_due := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_resolution_changes ON public.teacher_tracking;
CREATE TRIGGER trg_track_resolution_changes
  BEFORE UPDATE ON public.teacher_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.track_resolution_changes();

-- After update: insert recurrence history row for manual reopen
CREATE OR REPLACE FUNCTION public.log_manual_recurrence()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.problem_resolved = false
     AND OLD.problem_resolved = true
     AND NEW.recurrence_count > COALESCE(OLD.recurrence_count, 0) THEN
    INSERT INTO public.teacher_recurrences (teacher_id, source)
    VALUES (NEW.id, 'manual');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_manual_recurrence ON public.teacher_tracking;
CREATE TRIGGER trg_log_manual_recurrence
  AFTER UPDATE ON public.teacher_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.log_manual_recurrence();

-- 4) Update upsert_teacher_from_incident: reopen resolved teachers on new internal incident
CREATE OR REPLACE FUNCTION public.upsert_teacher_from_incident()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _name TEXT;
  _norm TEXT;
  _existing_id UUID;
  _existing_resolved BOOLEAN;
BEGIN
  IF NEW.incident_mode = 'interno' AND NEW.teacher_name IS NOT NULL AND TRIM(NEW.teacher_name) <> '' THEN
    _name := TRIM(normalize(NEW.teacher_name, NFC));
    _norm := LOWER(_name);

    SELECT id, problem_resolved INTO _existing_id, _existing_resolved
    FROM public.teacher_tracking
    WHERE LOWER(TRIM(normalize(teacher_name, NFC))) = _norm
    LIMIT 1;

    IF _existing_id IS NULL THEN
      SELECT id, problem_resolved INTO _existing_id, _existing_resolved
      FROM public.teacher_tracking
      WHERE public.similarity(LOWER(TRIM(normalize(teacher_name, NFC))), _norm) >= 0.85
      ORDER BY public.similarity(LOWER(TRIM(normalize(teacher_name, NFC))), _norm) DESC
      LIMIT 1;
    END IF;

    IF _existing_id IS NULL THEN
      INSERT INTO public.teacher_tracking (teacher_name)
      VALUES (_name)
      ON CONFLICT DO NOTHING;
    ELSIF _existing_resolved = true THEN
      -- Reopen + count recurrence (BEFORE UPDATE trigger handles the reset)
      UPDATE public.teacher_tracking
      SET problem_resolved = false
      WHERE id = _existing_id;

      -- Replace last 'manual' recurrence (inserted by AFTER trigger) with 'incident' source
      DELETE FROM public.teacher_recurrences
      WHERE id = (
        SELECT id FROM public.teacher_recurrences
        WHERE teacher_id = _existing_id AND source = 'manual'
        ORDER BY occurred_at DESC LIMIT 1
      );
      INSERT INTO public.teacher_recurrences (teacher_id, source, incident_id)
      VALUES (_existing_id, 'incident', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
