
-- Drop and recreate incidents policies to include suporte for all modes
DROP POLICY IF EXISTS "Role-based read incidents" ON public.incidents;
DROP POLICY IF EXISTS "Role-based insert incidents" ON public.incidents;
DROP POLICY IF EXISTS "Role-based update incidents" ON public.incidents;
DROP POLICY IF EXISTS "Role-based delete incidents" ON public.incidents;

CREATE POLICY "Role-based read incidents" ON public.incidents FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'coordenacao'::app_role) OR has_role(auth.uid(), 'suporte'::app_role) OR (has_role(auth.uid(), 'suporte_aluno'::app_role) AND incident_mode = 'professor'));

CREATE POLICY "Role-based insert incidents" ON public.incidents FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'coordenacao'::app_role) OR has_role(auth.uid(), 'suporte'::app_role) OR (has_role(auth.uid(), 'suporte_aluno'::app_role) AND incident_mode = 'professor'));

CREATE POLICY "Role-based update incidents" ON public.incidents FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'coordenacao'::app_role) OR has_role(auth.uid(), 'suporte'::app_role) OR (has_role(auth.uid(), 'suporte_aluno'::app_role) AND incident_mode = 'professor'));

CREATE POLICY "Role-based delete incidents" ON public.incidents FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'coordenacao'::app_role) OR has_role(auth.uid(), 'suporte'::app_role) OR (has_role(auth.uid(), 'suporte_aluno'::app_role) AND incident_mode = 'professor'));

-- Drop and recreate incident_comments policies similarly
DROP POLICY IF EXISTS "Role-based read comments" ON public.incident_comments;
DROP POLICY IF EXISTS "Role-based insert comments" ON public.incident_comments;
DROP POLICY IF EXISTS "Role-based delete comments" ON public.incident_comments;

CREATE POLICY "Role-based read comments" ON public.incident_comments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM incidents i WHERE i.id = incident_comments.incident_id AND (has_role(auth.uid(), 'coordenacao'::app_role) OR has_role(auth.uid(), 'suporte'::app_role) OR (has_role(auth.uid(), 'suporte_aluno'::app_role) AND i.incident_mode = 'professor'))));

CREATE POLICY "Role-based insert comments" ON public.incident_comments FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM incidents i WHERE i.id = incident_comments.incident_id AND (has_role(auth.uid(), 'coordenacao'::app_role) OR has_role(auth.uid(), 'suporte'::app_role) OR (has_role(auth.uid(), 'suporte_aluno'::app_role) AND i.incident_mode = 'professor'))));

CREATE POLICY "Role-based delete comments" ON public.incident_comments FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM incidents i WHERE i.id = incident_comments.incident_id AND (has_role(auth.uid(), 'coordenacao'::app_role) OR has_role(auth.uid(), 'suporte'::app_role) OR (has_role(auth.uid(), 'suporte_aluno'::app_role) AND i.incident_mode = 'professor'))));
