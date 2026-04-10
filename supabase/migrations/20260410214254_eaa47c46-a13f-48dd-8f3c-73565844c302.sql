
-- ================================================
-- 1. Explicit DENY policies on user_roles
-- ================================================
-- RLS is already enabled, so no permissive policy = deny by default.
-- Adding explicit restrictive policies makes the intent auditable.

-- Block all INSERT on user_roles (only service-role / SECURITY DEFINER can insert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Deny insert on user_roles'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Deny insert on user_roles"
        ON public.user_roles FOR INSERT
        TO authenticated
        WITH CHECK (false)
    $policy$;
  END IF;
END $$;

-- Block all UPDATE on user_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Deny update on user_roles'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Deny update on user_roles"
        ON public.user_roles FOR UPDATE
        TO authenticated
        USING (false)
    $policy$;
  END IF;
END $$;

-- Block all DELETE on user_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Deny delete on user_roles'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Deny delete on user_roles"
        ON public.user_roles FOR DELETE
        TO authenticated
        USING (false)
    $policy$;
  END IF;
END $$;

-- ================================================
-- 2. Make incident-images bucket private
-- ================================================
UPDATE storage.buckets
SET public = false
WHERE id = 'incident-images';

-- Drop old permissive public policies if they exist
DROP POLICY IF EXISTS "Anyone can view incident images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload incident images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete incident images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view incident images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload incident images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete incident images" ON storage.objects;

-- Authenticated users with valid roles can view images
CREATE POLICY "Authenticated users can view incident images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'incident-images'
    AND (
      public.has_role(auth.uid(), 'coordenacao'::public.app_role)
      OR public.has_role(auth.uid(), 'suporte'::public.app_role)
      OR public.has_role(auth.uid(), 'suporte_aluno'::public.app_role)
    )
  );

-- Authenticated users with valid roles can upload images
CREATE POLICY "Authenticated users can upload incident images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'incident-images'
    AND (
      public.has_role(auth.uid(), 'coordenacao'::public.app_role)
      OR public.has_role(auth.uid(), 'suporte'::public.app_role)
      OR public.has_role(auth.uid(), 'suporte_aluno'::public.app_role)
    )
  );

-- Authenticated users with valid roles can delete images
CREATE POLICY "Authenticated users can delete incident images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'incident-images'
    AND (
      public.has_role(auth.uid(), 'coordenacao'::public.app_role)
      OR public.has_role(auth.uid(), 'suporte'::public.app_role)
      OR public.has_role(auth.uid(), 'suporte_aluno'::public.app_role)
    )
  );
