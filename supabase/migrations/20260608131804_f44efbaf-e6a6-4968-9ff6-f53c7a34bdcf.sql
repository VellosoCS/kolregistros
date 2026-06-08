
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- Delete known duplicate teacher_tracking rows BEFORE normalizing (none have folders/meetings)
DELETE FROM public.teacher_tracking
WHERE id IN (
  'dc0c5f84-4b49-412e-8d08-21a26afb4ad1',
  'b48a6436-223f-4da8-9c69-94d32eeb9eee'
);

-- Normalize remaining teacher_tracking names (NFC + trim)
UPDATE public.teacher_tracking
SET teacher_name = TRIM(normalize(teacher_name, NFC))
WHERE teacher_name <> TRIM(normalize(teacher_name, NFC));

-- Normalize incidents
UPDATE public.incidents
SET teacher_name = TRIM(normalize(teacher_name, NFC))
WHERE teacher_name IS NOT NULL AND teacher_name <> TRIM(normalize(teacher_name, NFC));

UPDATE public.incidents SET teacher_name = 'Mariana Deiroz de Souza'
  WHERE teacher_name = 'Mariana DEiroz de Souza';
UPDATE public.incidents SET teacher_name = 'Sarah Isabel Skupien'
  WHERE teacher_name = 'Sara Isabel Skupien';

-- Unique index on normalized (case + unicode) name to block exact future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS teacher_tracking_name_normalized_key
  ON public.teacher_tracking ((LOWER(TRIM(normalize(teacher_name, NFC)))));

-- Similarity-aware upsert function
CREATE OR REPLACE FUNCTION public.upsert_teacher_from_incident()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _name TEXT;
  _norm TEXT;
  _existing_id UUID;
BEGIN
  IF NEW.incident_mode = 'interno' AND NEW.teacher_name IS NOT NULL AND TRIM(NEW.teacher_name) <> '' THEN
    _name := TRIM(normalize(NEW.teacher_name, NFC));
    _norm := LOWER(_name);

    SELECT id INTO _existing_id
    FROM public.teacher_tracking
    WHERE LOWER(TRIM(normalize(teacher_name, NFC))) = _norm
    LIMIT 1;

    IF _existing_id IS NULL THEN
      SELECT id INTO _existing_id
      FROM public.teacher_tracking
      WHERE public.similarity(LOWER(TRIM(normalize(teacher_name, NFC))), _norm) >= 0.85
      ORDER BY public.similarity(LOWER(TRIM(normalize(teacher_name, NFC))), _norm) DESC
      LIMIT 1;
    END IF;

    IF _existing_id IS NULL THEN
      INSERT INTO public.teacher_tracking (teacher_name)
      VALUES (_name)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
