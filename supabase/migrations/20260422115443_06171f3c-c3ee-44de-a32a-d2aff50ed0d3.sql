CREATE OR REPLACE FUNCTION public.approve_pending_user(_user_id uuid, _role app_role, _display_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _clean_name TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'coordenacao') THEN
    RAISE EXCEPTION 'Only coordenacao can approve users';
  END IF;

  _clean_name := NULLIF(TRIM(_display_name), '');
  IF _clean_name IS NULL THEN
    RAISE EXCEPTION 'Display name is required';
  END IF;

  -- Insert role for user (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT DO NOTHING;

  -- Update profile with chosen display name
  UPDATE public.profiles
  SET display_name = _clean_name
  WHERE user_id = _user_id;

  -- Update pending approval (also store chosen display name for audit)
  UPDATE public.pending_approvals
  SET status = 'approved',
      approved_at = now(),
      approved_by = auth.uid(),
      assigned_role = _role,
      display_name = _clean_name
  WHERE user_id = _user_id;
END;
$function$;

-- Drop old 2-arg version if it exists
DROP FUNCTION IF EXISTS public.approve_pending_user(uuid, app_role);