

## Mudanças Solicitadas

1. **Renomear** "Suporte ao Professor" → "Suporte" no switch de modo do formulário
2. **Alterar acesso do Suporte ao Aluno**: passa a ter acesso apenas ao modo "Suporte" (professor), sem acesso ao "Controle Interno"
3. **Permitir edição e exclusão** para Suporte e Suporte ao Aluno nos registros dos seus setores

### Impacto na Tabela de Permissões

| Funcionalidade | Coordenação | Suporte | Suporte ao Aluno |
|---|---|---|---|
| Ver incidentes | Todos | Modo professor | Modo professor |
| Criar incidentes | Ambos os modos | Modo professor | Modo professor |
| Editar incidentes | Todos | Modo professor | Modo professor |
| **Excluir incidentes** | **Todos** | **Modo professor** | **Modo professor** |
| Controle Interno | Sim | Não | **Não** |
| Mês de Análise | Sim | Não | Não |

### Alterações

**1. `src/components/IncidentForm.tsx`**
- Renomear label "Suporte ao Professor" → "Suporte" no botão de toggle de modo

**2. `src/pages/Index.tsx`**
- Alterar `allowedMode` de `suporte_aluno` de `"interno"` para `"professor"`
- Alterar `defaultTab` de `suporte_aluno` de `"interno"` para `"active"`
- Remover restrição `canDelete = role === "coordenacao"` — todos os papéis autenticados podem excluir
- Remover visibilidade da aba "Controle Interno" para `suporte_aluno`

**3. RLS no banco (migração SQL)**
- Atualizar política de **SELECT** em `incidents`: `suporte_aluno` agora lê `incident_mode = 'professor'` (igual ao suporte)
- Atualizar política de **INSERT** em `incidents`: `suporte_aluno` insere em `incident_mode = 'professor'`
- Atualizar política de **UPDATE** em `incidents`: `suporte_aluno` atualiza em `incident_mode = 'professor'`
- Atualizar política de **DELETE** em `incidents`: permitir que `suporte` e `suporte_aluno` excluam registros de `incident_mode = 'professor'` (além da coordenação que exclui tudo)

**4. `src/contexts/AuthContext.tsx`**
- Atualizar label de `suporte_aluno` de "Suporte ao Aluno" para manter (sem mudança visual no header)

### Detalhes Técnicos — Migração RLS

```sql
-- Drop e recriar as 4 políticas de incidents
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

-- INSERT, UPDATE: mesma lógica
-- DELETE: todos podem excluir nos seus modos
CREATE POLICY "Role-based delete incidents" ON public.incidents
FOR DELETE TO authenticated USING (
  has_role(auth.uid(), 'coordenacao') OR
  (has_role(auth.uid(), 'suporte') AND incident_mode = 'professor') OR
  (has_role(auth.uid(), 'suporte_aluno') AND incident_mode = 'professor')
);
```

