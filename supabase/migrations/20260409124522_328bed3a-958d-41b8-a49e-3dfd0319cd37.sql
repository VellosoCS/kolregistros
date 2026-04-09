-- Drop existing policies
DROP POLICY "Role-based read incidents" ON public.incidents;
DROP POLICY "Role-based insert incidents" ON public.incidents;
DROP POLICY "Role-based update incidents" ON public.incidents;
DROP POLICY "Only coordenacao can delete incidents" ON public.incidents;

-- SELECT: coordenacao vê tudo, suporte e suporte_aluno veem modo professor
CREATE POLICY "Role-based read incidents" ON public.incidents
FOR SELECT TO authenticated USING (
  has_role(auth.uid(), 'coordenacao') OR
  (has_role(auth.uid(), 'suporte') AND incident_mode = 'professor') OR
  (has_role(auth.uid(), 'suporte_aluno') AND incident_mode = 'professor')
);

-- INSERT
CREATE POLICY "Role-based insert incidents" ON public.incidents
FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(), 'coordenacao') OR
  (has_role(auth.uid(), 'suporte') AND incident_mode = 'professor') OR
  (has_role(auth.uid(), 'suporte_aluno') AND incident_mode = 'professor')
);

-- UPDATE
CREATE POLICY "Role-based update incidents" ON public.incidents
FOR UPDATE TO authenticated USING (
  has_role(auth.uid(), 'coordenacao') OR
  (has_role(auth.uid(), 'suporte') AND incident_mode = 'professor') OR
  (has_role(auth.uid(), 'suporte_aluno') AND incident_mode = 'professor')
);

-- DELETE: todos podem excluir nos seus modos
CREATE POLICY "Role-based delete incidents" ON public.incidents
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'coordenacao') OR
  (has_role(auth.uid(), 'suporte') AND incident_mode = 'professor') OR
  (has_role(auth.uid(), 'suporte_aluno') AND incident_mode = 'professor')
);