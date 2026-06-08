
CREATE TABLE public.teacher_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_folders TO authenticated;
GRANT ALL ON public.teacher_folders TO service_role;

ALTER TABLE public.teacher_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acompanhamento roles can read folders"
  ON public.teacher_folders FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordenacao')
    OR public.has_role(auth.uid(), 'suporte')
    OR public.has_role(auth.uid(), 'suporte_aluno')
  );

CREATE POLICY "Acompanhamento roles can insert folders"
  ON public.teacher_folders FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'coordenacao')
    OR public.has_role(auth.uid(), 'suporte')
    OR public.has_role(auth.uid(), 'suporte_aluno')
  );

CREATE POLICY "Acompanhamento roles can update folders"
  ON public.teacher_folders FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordenacao')
    OR public.has_role(auth.uid(), 'suporte')
    OR public.has_role(auth.uid(), 'suporte_aluno')
  );

CREATE POLICY "Acompanhamento roles can delete folders"
  ON public.teacher_folders FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordenacao')
    OR public.has_role(auth.uid(), 'suporte')
    OR public.has_role(auth.uid(), 'suporte_aluno')
  );

CREATE TRIGGER update_teacher_folders_updated_at
  BEFORE UPDATE ON public.teacher_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.teacher_folder_members (
  folder_id UUID NOT NULL REFERENCES public.teacher_folders(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teacher_tracking(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (folder_id, teacher_id)
);

CREATE INDEX idx_teacher_folder_members_folder ON public.teacher_folder_members(folder_id);
CREATE INDEX idx_teacher_folder_members_teacher ON public.teacher_folder_members(teacher_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_folder_members TO authenticated;
GRANT ALL ON public.teacher_folder_members TO service_role;

ALTER TABLE public.teacher_folder_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acompanhamento roles can read folder members"
  ON public.teacher_folder_members FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordenacao')
    OR public.has_role(auth.uid(), 'suporte')
    OR public.has_role(auth.uid(), 'suporte_aluno')
  );

CREATE POLICY "Acompanhamento roles can insert folder members"
  ON public.teacher_folder_members FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'coordenacao')
    OR public.has_role(auth.uid(), 'suporte')
    OR public.has_role(auth.uid(), 'suporte_aluno')
  );

CREATE POLICY "Acompanhamento roles can delete folder members"
  ON public.teacher_folder_members FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'coordenacao')
    OR public.has_role(auth.uid(), 'suporte')
    OR public.has_role(auth.uid(), 'suporte_aluno')
  );
