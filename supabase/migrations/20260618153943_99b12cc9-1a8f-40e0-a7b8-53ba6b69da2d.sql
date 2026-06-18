
-- teacher_notes: restrict to authorized roles
DROP POLICY IF EXISTS "Authenticated users can manage teacher notes" ON public.teacher_notes;
CREATE POLICY "Authorized roles can view teacher notes" ON public.teacher_notes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'coordenacao') OR public.has_role(auth.uid(),'suporte') OR public.has_role(auth.uid(),'suporte_aluno'));
CREATE POLICY "Authorized roles can insert teacher notes" ON public.teacher_notes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'coordenacao') OR public.has_role(auth.uid(),'suporte') OR public.has_role(auth.uid(),'suporte_aluno'));
CREATE POLICY "Authorized roles can update teacher notes" ON public.teacher_notes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'coordenacao') OR public.has_role(auth.uid(),'suporte') OR public.has_role(auth.uid(),'suporte_aluno'))
  WITH CHECK (public.has_role(auth.uid(),'coordenacao') OR public.has_role(auth.uid(),'suporte') OR public.has_role(auth.uid(),'suporte_aluno'));
CREATE POLICY "Authorized roles can delete teacher notes" ON public.teacher_notes
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'coordenacao') OR public.has_role(auth.uid(),'suporte') OR public.has_role(auth.uid(),'suporte_aluno'));

-- teacher_recurrences: restrict to authorized roles
DROP POLICY IF EXISTS "Authenticated can view recurrences" ON public.teacher_recurrences;
DROP POLICY IF EXISTS "Authenticated can insert recurrences" ON public.teacher_recurrences;
DROP POLICY IF EXISTS "Authenticated can delete recurrences" ON public.teacher_recurrences;
CREATE POLICY "Authorized roles can view recurrences" ON public.teacher_recurrences
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'coordenacao') OR public.has_role(auth.uid(),'suporte') OR public.has_role(auth.uid(),'suporte_aluno'));
CREATE POLICY "Authorized roles can insert recurrences" ON public.teacher_recurrences
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'coordenacao') OR public.has_role(auth.uid(),'suporte') OR public.has_role(auth.uid(),'suporte_aluno'));
CREATE POLICY "Authorized roles can delete recurrences" ON public.teacher_recurrences
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'coordenacao') OR public.has_role(auth.uid(),'suporte') OR public.has_role(auth.uid(),'suporte_aluno'));

-- pending_approvals: explicit block on direct inserts (signup uses SECURITY DEFINER trigger which bypasses RLS)
CREATE POLICY "Block direct inserts on pending approvals" ON public.pending_approvals
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);

-- Realtime: scope channel subscriptions to authenticated users (default-deny baseline)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can write realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated can read realtime messages" ON realtime.messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can write realtime messages" ON realtime.messages
  FOR INSERT TO authenticated WITH CHECK (true);
