-- 1) Tabela de delegações
CREATE TABLE public.incident_delegations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  delegated_to UUID NOT NULL,
  delegated_by UUID NOT NULL,
  delegated_to_name TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (incident_id, delegated_to)
);

CREATE INDEX idx_incident_delegations_to ON public.incident_delegations(delegated_to);
CREATE INDEX idx_incident_delegations_incident ON public.incident_delegations(incident_id);
CREATE INDEX idx_incident_delegations_unread ON public.incident_delegations(delegated_to) WHERE is_read = false;

ALTER TABLE public.incident_delegations ENABLE ROW LEVEL SECURITY;

-- Recebedor ou criador podem ler
CREATE POLICY "Recipient or creator can read delegations"
ON public.incident_delegations
FOR SELECT
TO authenticated
USING (auth.uid() = delegated_to OR auth.uid() = delegated_by OR public.has_role(auth.uid(), 'coordenacao'));

-- Apenas usuários com papel podem criar (e como o próprio autor)
CREATE POLICY "Users with role can create delegations"
ON public.incident_delegations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = delegated_by AND (
    public.has_role(auth.uid(), 'coordenacao') OR
    public.has_role(auth.uid(), 'suporte') OR
    public.has_role(auth.uid(), 'suporte_aluno')
  )
);

-- Recebedor pode marcar como lido (atualizar)
CREATE POLICY "Recipient can update own delegation"
ON public.incident_delegations
FOR UPDATE
TO authenticated
USING (auth.uid() = delegated_to)
WITH CHECK (auth.uid() = delegated_to);

-- Autor da delegação ou Coordenação podem deletar
CREATE POLICY "Creator or coordenacao can delete"
ON public.incident_delegations
FOR DELETE
TO authenticated
USING (auth.uid() = delegated_by OR public.has_role(auth.uid(), 'coordenacao'));

-- Realtime
ALTER TABLE public.incident_delegations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_delegations;

-- 2) View de usuários aprovados (somente quem tem role atribuída)
CREATE OR REPLACE VIEW public.approved_users
WITH (security_invoker = true)
AS
SELECT
  p.user_id,
  p.display_name,
  p.email,
  ur.role
FROM public.profiles p
INNER JOIN public.user_roles ur ON ur.user_id = p.user_id;

-- A view herda RLS via security_invoker. Como profiles só permite ler o próprio perfil,
-- precisamos de uma política adicional para permitir leitura de outros perfis (apenas
-- para usuários autenticados que tenham um papel — para popular o autocomplete).
CREATE POLICY "Authenticated with role can read profiles for delegation"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'coordenacao') OR
  public.has_role(auth.uid(), 'suporte') OR
  public.has_role(auth.uid(), 'suporte_aluno')
);

-- Permitir leitura cruzada de user_roles também (necessária pelo INNER JOIN da view com security_invoker)
CREATE POLICY "Authenticated with role can read all user_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'coordenacao') OR
  public.has_role(auth.uid(), 'suporte') OR
  public.has_role(auth.uid(), 'suporte_aluno')
);

GRANT SELECT ON public.approved_users TO authenticated;