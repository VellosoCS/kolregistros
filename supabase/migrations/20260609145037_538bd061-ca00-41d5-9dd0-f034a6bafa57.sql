-- Single source of truth: Monday of the week containing the last day of the month
CREATE OR REPLACE FUNCTION public.last_week_of_month(_ref date)
RETURNS date
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT (
    (date_trunc('month', _ref) + INTERVAL '1 month - 1 day')::date
    - (EXTRACT(ISODOW FROM (date_trunc('month', _ref) + INTERVAL '1 month - 1 day')::date)::int - 1)
  );
$$;

-- Trigger uses the shared helper
CREATE OR REPLACE FUNCTION public.compute_next_message_due()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.next_message_due IS DISTINCT FROM OLD.next_message_due THEN
    RETURN NEW;
  END IF;

  IF NEW.problem_resolved THEN
    NEW.next_message_due := NULL;
  ELSIF NEW.second_message_sent AND NEW.second_message_date IS NOT NULL THEN
    IF NEW.message_stage = 3 THEN
      NEW.next_message_due := public.last_week_of_month(NEW.second_message_date);
    ELSE
      NEW.next_message_due := NEW.second_message_date + INTERVAL '14 days';
    END IF;
  ELSIF NEW.first_message_sent AND NEW.first_message_date IS NOT NULL THEN
    NEW.next_message_due := NEW.first_message_date + INTERVAL '14 days';
  ELSE
    NEW.next_message_due := NULL;
  END IF;
  RETURN NEW;
END;
$function$;

-- Recompute existing stage=3 rows so all display the consistent date
UPDATE public.teacher_tracking
SET next_message_due = public.last_week_of_month(
  COALESCE(second_message_date, CURRENT_DATE)
)
WHERE message_stage = 3 AND problem_resolved = false;
