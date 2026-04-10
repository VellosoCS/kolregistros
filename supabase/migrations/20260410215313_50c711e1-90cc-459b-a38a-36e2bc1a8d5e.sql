
-- 1. UPDATE policy on storage bucket (incident-images)
CREATE POLICY "Authenticated users can update incident images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'incident-images'
    AND (
      public.has_role(auth.uid(), 'coordenacao'::public.app_role)
      OR public.has_role(auth.uid(), 'suporte'::public.app_role)
      OR public.has_role(auth.uid(), 'suporte_aluno'::public.app_role)
    )
  );

-- 2. UPDATE policy on incident_comments
CREATE POLICY "Role-based update comments"
  ON public.incident_comments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM incidents i
      WHERE i.id = incident_comments.incident_id
      AND (
        public.has_role(auth.uid(), 'coordenacao'::public.app_role)
        OR public.has_role(auth.uid(), 'suporte'::public.app_role)
        OR (public.has_role(auth.uid(), 'suporte_aluno'::public.app_role) AND i.incident_mode = 'professor')
      )
    )
  );
