-- Extend incident_delegations with task lifecycle fields
ALTER TABLE public.incident_delegations
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS declined_at timestamptz,
  ADD COLUMN IF NOT EXISTS due_date date;

-- Existing rows are treated as accepted (backward compatibility)
UPDATE public.incident_delegations
SET status = 'accepted', accepted_at = COALESCE(read_at, created_at)
WHERE status = 'pending' AND is_read = true;

-- Validation trigger keeps status in sync with timestamps
CREATE OR REPLACE FUNCTION public.task_status_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('pending','accepted','in_progress','completed','declined') THEN
    RAISE EXCEPTION 'Invalid delegation status: %', NEW.status;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'accepted' AND NEW.accepted_at IS NULL THEN
      NEW.accepted_at := now();
    END IF;
    IF NEW.status = 'in_progress' AND NEW.accepted_at IS NULL THEN
      NEW.accepted_at := now();
    END IF;
    IF NEW.status = 'completed' THEN
      IF NEW.accepted_at IS NULL THEN NEW.accepted_at := now(); END IF;
      NEW.completed_at := now();
    END IF;
    IF NEW.status = 'declined' THEN
      NEW.declined_at := now();
    END IF;
    IF NEW.status IN ('accepted','in_progress','completed') AND NEW.is_read = false THEN
      NEW.is_read := true;
      NEW.read_at := COALESCE(NEW.read_at, now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_status_timestamps ON public.incident_delegations;
CREATE TRIGGER trg_task_status_timestamps
BEFORE INSERT OR UPDATE ON public.incident_delegations
FOR EACH ROW EXECUTE FUNCTION public.task_status_timestamps();
