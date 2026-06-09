CREATE OR REPLACE FUNCTION public.compute_next_message_due()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- If user explicitly changed next_message_due in this update, respect it.
  IF TG_OP = 'UPDATE' AND NEW.next_message_due IS DISTINCT FROM OLD.next_message_due THEN
    RETURN NEW;
  END IF;

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
$function$;