CREATE OR REPLACE FUNCTION public.enforce_tracking_date_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  iso text;
BEGIN
  -- Columns are DATE; cast to ISO and assert no implicit time portion.
  FOREACH iso IN ARRAY ARRAY[
    NEW.first_message_date::text,
    NEW.second_message_date::text,
    NEW.next_message_due::text
  ] LOOP
    IF iso IS NOT NULL AND iso !~ '^\d{4}-\d{2}-\d{2}$' THEN
      RAISE EXCEPTION 'Tracking date columns must be date-only (YYYY-MM-DD), got %', iso;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_tracking_date_only_trigger ON public.teacher_tracking;
CREATE TRIGGER enforce_tracking_date_only_trigger
BEFORE INSERT OR UPDATE ON public.teacher_tracking
FOR EACH ROW EXECUTE FUNCTION public.enforce_tracking_date_only();
