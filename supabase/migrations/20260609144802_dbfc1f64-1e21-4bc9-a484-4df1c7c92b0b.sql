-- Add message_stage column to track 2nd vs 3rd message
ALTER TABLE public.teacher_tracking
ADD COLUMN IF NOT EXISTS message_stage smallint NOT NULL DEFAULT 2;

ALTER TABLE public.teacher_tracking
DROP CONSTRAINT IF EXISTS teacher_tracking_message_stage_check;

ALTER TABLE public.teacher_tracking
ADD CONSTRAINT teacher_tracking_message_stage_check CHECK (message_stage IN (2, 3));

-- Rewrite trigger: 14 days for second-message due; last week of month when stage=3
CREATE OR REPLACE FUNCTION public.compute_next_message_due()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Respect explicit manual changes
  IF TG_OP = 'UPDATE' AND NEW.next_message_due IS DISTINCT FROM OLD.next_message_due THEN
    RETURN NEW;
  END IF;

  IF NEW.problem_resolved THEN
    NEW.next_message_due := NULL;
  ELSIF NEW.second_message_sent AND NEW.second_message_date IS NOT NULL THEN
    IF NEW.message_stage = 3 THEN
      -- last week of the month containing second_message_date
      NEW.next_message_due := (date_trunc('month', NEW.second_message_date::timestamp) + INTERVAL '1 month - 7 days')::date;
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
