## Objetivo

Adicionar ao Acompanhamento da Coordenação um fluxo de **arquivamento automático** de professores resolvidos e um sistema de **reincidência** com escala visual de gravidade.

---

## 1. Arquivamento automático

- Criar uma aba/pasta de sistema **"Arquivados"** (não editável, não excluível, separada da lista de pastas comuns).
- Ao marcar `problem_resolved = true`, o professor sai automaticamente das abas "Todos" e das pastas comuns, e aparece **apenas** na aba "Arquivados".
- Ao desmarcar `problem_resolved` (reabertura), volta para "Todos".
- A aba "Arquivados" exibe data de resolução, contador de reincidências e botão "Reabrir".

## 2. Reincidência

Disparada em **dois casos**:

- **Automático**: ao criar um novo incidente de Controle Interno para um professor que está atualmente `problem_resolved = true` → o tracking é reaberto (`problem_resolved = false`, zera datas de mensagens, `message_stage = 1`) e `recurrence_count` incrementa em 1, registrando a data em `last_recurrence_at`.
- **Manual**: ao desmarcar "resolvido" na coordenação para um professor já resolvido → mesmo incremento.

Cada reincidência também grava uma linha em `teacher_recurrences` (histórico) com data e origem (`incident` ou `manual`).

## 3. Escala visual de gravidade

Badge "Reincidente Nx" aplicado em todas as visualizações do professor (linha da tabela de acompanhamento, header expandido, perfil futuro):

- **0** → sem badge
- **1** → badge amarelo (`bg-yellow-500/15 text-yellow-700`)
- **2** → badge laranja (`bg-orange-500/15 text-orange-700`)
- **3+** → badge vermelho (`bg-urgency-high/20 text-urgency-high`) + linha inteira destacada com `bg-urgency-high/5` e borda esquerda vermelha

Contador global no header da página: "X professor(es) reincidente(s)".

---

## Detalhes técnicos

### Migração de banco

1. `ALTER TABLE public.teacher_tracking`:
   - `recurrence_count INT NOT NULL DEFAULT 0`
   - `last_recurrence_at TIMESTAMPTZ`
   - `resolved_at TIMESTAMPTZ` (preenchida via trigger quando `problem_resolved` vira `true`)
2. Nova tabela `public.teacher_recurrences` (id, teacher_id FK, occurred_at, source `'incident' | 'manual'`, incident_id FK nullable) + GRANT + RLS espelhando políticas de `teacher_tracking`.
3. Trigger `track_resolution_timestamp` em `teacher_tracking`: ao mudar `problem_resolved` de false→true preenche `resolved_at = now()`; de true→false dispara reincidência manual (incrementa contador, insere `teacher_recurrences` com `source='manual'`, limpa datas de mensagem, `message_stage = 1`).
4. Atualizar `upsert_teacher_from_incident()`: quando o tracking existente está com `problem_resolved = true`, reabrir (mesmo efeito acima) e inserir `teacher_recurrences` com `source='incident'` e `incident_id = NEW.id`.

### Frontend

- `src/hooks/use-teacher-tracking.ts`: adicionar campos `recurrence_count`, `last_recurrence_at`, `resolved_at` ao tipo `TeacherTracking`.
- `src/pages/AcompanhamentoSuporte.tsx`:
  - Aba especial "Arquivados (N)" antes das pastas, ativa via `activeFolderId === '__archived__'`.
  - Filtro: "Todos" e pastas comuns excluem `problem_resolved`; "Arquivados" mostra somente `problem_resolved`.
  - Remover checkbox "Mostrar resolvidos" (substituído pela aba).
  - `TeacherRow`: badge de reincidência ao lado do nome com escala de cor; quando `recurrence_count >= 3` aplica destaque na linha inteira.
  - Botão "Reabrir" na aba Arquivados (desmarca `problem_resolved`).
- Novo helper `src/lib/recurrence.ts` com função `getRecurrenceStyle(count)` retornando `{ label, badgeClass, rowClass }`.

### Memória

Adicionar `mem://features/acompanhamento/reincidencia` documentando: pasta "Arquivados" automática, gatilhos de reincidência (novo incidente interno OU reabertura manual), escala 1/2/3+ amarelo/laranja/vermelho.
