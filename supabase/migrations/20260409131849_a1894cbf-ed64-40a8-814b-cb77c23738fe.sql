
-- 1. Fix profiles SELECT: restrict to own profile
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 2. Fix storage: restrict upload and delete to authenticated users
DROP POLICY IF EXISTS "Anyone can upload incident images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete incident images" ON storage.objects;

CREATE POLICY "Authenticated users can upload incident images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'incident-images');

CREATE POLICY "Authenticated users can delete incident images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'incident-images');

-- 3. Fix incident_comments INSERT: role-based like incidents
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON public.incident_comments;
CREATE POLICY "Role-based insert comments"
  ON public.incident_comments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_id
      AND (
        has_role(auth.uid(), 'coordenacao') OR
        (has_role(auth.uid(), 'suporte') AND i.incident_mode = 'professor') OR
        (has_role(auth.uid(), 'suporte_aluno') AND i.incident_mode = 'professor')
      )
    )
  );

-- 4. Fix incident_comments DELETE: role-based like incidents (not just coordenacao)
DROP POLICY IF EXISTS "Only coordenacao can delete comments" ON public.incident_comments;
CREATE POLICY "Role-based delete comments"
  ON public.incident_comments FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_id
      AND (
        has_role(auth.uid(), 'coordenacao') OR
        (has_role(auth.uid(), 'suporte') AND i.incident_mode = 'professor') OR
        (has_role(auth.uid(), 'suporte_aluno') AND i.incident_mode = 'professor')
      )
    )
  );

-- 5. Fix incident_comments SELECT: role-based like incidents
DROP POLICY IF EXISTS "Authenticated users can read comments" ON public.incident_comments;
CREATE POLICY "Role-based read comments"
  ON public.incident_comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_id
      AND (
        has_role(auth.uid(), 'coordenacao') OR
        (has_role(auth.uid(), 'suporte') AND i.incident_mode = 'professor') OR
        (has_role(auth.uid(), 'suporte_aluno') AND i.incident_mode = 'professor')
      )
    )
  );
