
-- 1. Restrict user_roles SELECT to own role
DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.user_roles;
CREATE POLICY "Users can read own role"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. Restrict storage INSERT to users with a valid role
DROP POLICY IF EXISTS "Authenticated users can upload incident images" ON storage.objects;
CREATE POLICY "Role-based upload incident images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'incident-images'
    AND (
      public.has_role(auth.uid(), 'coordenacao')
      OR public.has_role(auth.uid(), 'suporte')
      OR public.has_role(auth.uid(), 'suporte_aluno')
    )
  );

-- 3. Restrict storage DELETE to users with a valid role
DROP POLICY IF EXISTS "Authenticated users can delete incident images" ON storage.objects;
CREATE POLICY "Role-based delete incident images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'incident-images'
    AND (
      public.has_role(auth.uid(), 'coordenacao')
      OR public.has_role(auth.uid(), 'suporte')
      OR public.has_role(auth.uid(), 'suporte_aluno')
    )
  );
