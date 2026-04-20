-- Create pending_approvals table
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.pending_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  status public.approval_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_role public.app_role
);

ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;

-- Only coordenacao can view/manage approvals
CREATE POLICY "Coordenacao can view pending approvals"
ON public.pending_approvals
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Coordenacao can update pending approvals"
ON public.pending_approvals
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'coordenacao'));

CREATE POLICY "Coordenacao can delete pending approvals"
ON public.pending_approvals
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'coordenacao'));

-- Update handle_new_user trigger to also insert into pending_approvals
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  -- Insert pending approval entry for every new signup
  INSERT INTO public.pending_approvals (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: approve pending user and assign role (only coordenacao)
CREATE OR REPLACE FUNCTION public.approve_pending_user(_user_id uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'coordenacao') THEN
    RAISE EXCEPTION 'Only coordenacao can approve users';
  END IF;

  -- Insert role for user (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT DO NOTHING;

  -- Update pending approval
  UPDATE public.pending_approvals
  SET status = 'approved',
      approved_at = now(),
      approved_by = auth.uid(),
      assigned_role = _role
  WHERE user_id = _user_id;
END;
$$;

-- Function: reject pending user (only coordenacao)
CREATE OR REPLACE FUNCTION public.reject_pending_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'coordenacao') THEN
    RAISE EXCEPTION 'Only coordenacao can reject users';
  END IF;

  UPDATE public.pending_approvals
  SET status = 'rejected',
      approved_at = now(),
      approved_by = auth.uid()
  WHERE user_id = _user_id;
END;
$$;