
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('coordenacao', 'suporte', 'suporte_aluno');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Profiles RLS: authenticated users can read all profiles, update own
CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- User roles RLS: authenticated users can read roles
CREATE POLICY "Authenticated users can read roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (true);

-- Update incidents RLS: drop old public policies, add role-based
DROP POLICY IF EXISTS "Anyone can read incidents" ON public.incidents;
DROP POLICY IF EXISTS "Anyone can insert incidents" ON public.incidents;
DROP POLICY IF EXISTS "Anyone can update incidents" ON public.incidents;
DROP POLICY IF EXISTS "Anyone can delete incidents" ON public.incidents;

-- Coordenacao sees all; suporte sees professor mode; suporte_aluno sees interno mode
CREATE POLICY "Role-based read incidents"
  ON public.incidents FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordenacao')
    OR (public.has_role(auth.uid(), 'suporte') AND incident_mode = 'professor')
    OR (public.has_role(auth.uid(), 'suporte_aluno') AND incident_mode = 'interno')
  );

CREATE POLICY "Role-based insert incidents"
  ON public.incidents FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'coordenacao')
    OR (public.has_role(auth.uid(), 'suporte') AND incident_mode = 'professor')
    OR (public.has_role(auth.uid(), 'suporte_aluno') AND incident_mode = 'interno')
  );

CREATE POLICY "Role-based update incidents"
  ON public.incidents FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordenacao')
    OR (public.has_role(auth.uid(), 'suporte') AND incident_mode = 'professor')
    OR (public.has_role(auth.uid(), 'suporte_aluno') AND incident_mode = 'interno')
  );

-- Only coordenacao can delete
CREATE POLICY "Only coordenacao can delete incidents"
  ON public.incidents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'coordenacao'));

-- Update incident_comments RLS
DROP POLICY IF EXISTS "Anyone can read comments" ON public.incident_comments;
DROP POLICY IF EXISTS "Anyone can insert comments" ON public.incident_comments;
DROP POLICY IF EXISTS "Anyone can delete comments" ON public.incident_comments;

CREATE POLICY "Authenticated users can read comments"
  ON public.incident_comments FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON public.incident_comments FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only coordenacao can delete comments"
  ON public.incident_comments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'coordenacao'));
