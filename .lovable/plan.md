## Visão geral

Criar uma página **"Minhas Tarefas"** (`/tarefas`) que vive ao lado da Caixa de Entrada e gerencia o ciclo de vida das delegações recebidas: **Pendente → Aceita → Em andamento → Concluída** (mais o estado **Recusada**, ainda que sem motivo obrigatório, deixando o botão disponível caso necessário). Cada delegação ganha um prazo opcional definido pelo delegador.

A Caixa atual continua intacta (notificação/leitura). Quando uma nova tarefa chega, aparece um **toast em tempo real**; ao clicar, abre o **modal de aceitação** com todos os detalhes do incidente.

## Mudanças de banco

Estender `incident_delegations` em vez de criar nova tabela (já tem RLS e realtime):

- `status` text: `pending | accepted | in_progress | completed | declined` (default `pending`)
- `accepted_at` timestamptz
- `completed_at` timestamptz
- `declined_at` timestamptz
- `due_date` date (prazo opcional definido por quem delega)

Trigger `BEFORE UPDATE` para preencher timestamps automaticamente conforme `status` muda. Linhas existentes recebem `status = 'accepted'` (compatibilidade — já estavam sendo tratadas).

## Componentes / arquivos

**Novo:**
- `src/pages/MinhasTarefas.tsx` — página principal com:
  - Header com filtros por status (chips: Todas, Pendentes, Aceitas, Em andamento, Concluídas, Recusadas) e contagem.
  - Lista em **cards organizados** (não tabela) — mais legível para "detalhes do incidente":
    - Topo: tipo de problema (badge colorido por urgência), data de criação, badge de status, badge de prazo (verde/âmbar/vermelho conforme proximidade).
    - Meta: professor, responsável, turma, modo (interno/externo), delegado por.
    - Corpo: descrição (clamp 3 linhas, expansível).
    - Thumbnails de mídia (até 4) com link para detalhe completo.
    - Rodapé: ações por status (Aceitar / Iniciar / Concluir / Recusar / Ver incidente completo).
  - Vazio: empty state amigável.
  - Agrupamento opcional "Vencendo hoje" no topo.
- `src/components/TaskAcceptDialog.tsx` — modal de confirmação com layout rico:
  - Cabeçalho destacado com tipo + urgência.
  - Grid de metadados (professor, responsável, turma, data, delegado por, prazo).
  - Descrição completa.
  - Galeria de mídia (reaproveita `ImageCarouselDialog` / `CachedImage`).
  - Botões: **Aceitar tarefa** (primary), **Ver incidente completo** (link), **Depois** (fecha sem alterar).
- `src/components/TaskToast.tsx` (helper) — dispara `sonner` ao detectar nova delegação `pending`, com botão "Ver" que abre o modal de aceitação.

**Editados:**
- `src/hooks/use-delegations.ts` — adicionar:
  - `useUpdateDelegationStatus({ id, status })` (preenche timestamps no backend via trigger).
  - `useSetDelegationDueDate({ id, due_date })` para o delegador.
  - Hook `usePendingTaskToasts()` que escuta realtime de novas linhas `pending` para o usuário logado e dispara o toast.
- `src/App.tsx` — registrar rota `/tarefas` (protegida).
- `src/components/IndexHeader.tsx` / `NavLink.tsx` — adicionar link "Tarefas" com badge de pendentes (contagem `status=pending`).
- `src/components/IncidentForm.tsx` (ou onde o `MentionInput` cria delegação) — campo opcional **"Prazo da tarefa"** (DatePicker) que é salvo no `due_date` da delegação criada via `createDelegations`.
- `createDelegations` em `use-delegations.ts` — aceitar `dueDate?: string` opcional.

## Fluxo de aceitação

1. Delegador cria/edita incidente com menção `@user` (existente) + define prazo opcional → linhas em `incident_delegations` com `status='pending'`.
2. Realtime no destinatário: `usePendingTaskToasts` exibe `toast` ("Nova tarefa: <tipo> — de <delegador>") com botão **Ver**.
3. Clique em "Ver" → abre `TaskAcceptDialog` com todos os detalhes.
4. **Aceitar** → `status='accepted'`, `accepted_at=now()`. O sino/Caixa também marca como lida.
5. Na página `/tarefas`, ações por status: Iniciar (→ `in_progress`), Concluir (→ `completed`), Recusar (→ `declined`).
6. Status persistem; filtros e badges refletem em tempo real (realtime já existe).

## Layout (cards de tarefa)

```text
┌─────────────────────────────────────────────────────────┐
│ [Urgência] Brigas em sala            [Pendente] [2d]    │
│ Delegado por João • 18/06/2026                          │
├─────────────────────────────────────────────────────────┤
│ Professor: Maria   Responsável: Ana   Turma: 7B        │
│                                                         │
│ Descrição: dois alunos discutiram durante a aula...     │
│ [📷] [📷] [📷]                          + 2 mídias      │
├─────────────────────────────────────────────────────────┤
│            [Aceitar] [Recusar] [Ver incidente →]        │
└─────────────────────────────────────────────────────────┘
```

Cards em coluna única até `md`, grid de 2 a partir de `lg`. Borda esquerda colorida pelo status (cinza/azul/âmbar/verde/vermelho) usando tokens semânticos do `index.css`.

## Permissões / RLS

- Políticas atuais já restringem `incident_delegations` ao próprio usuário (`delegated_to = auth.uid()` para leitura/atualização). Apenas garantir que a policy de UPDATE permita o destinatário alterar `status` e que o delegador possa definir `due_date` na criação.
- Sem novas roles; respeita o RBAC existente.

## Fora do escopo

- Recusa com motivo obrigatório (excluído conforme preferência).
- Reatribuição da tarefa para outro usuário.
- Histórico/auditoria de mudanças de status (timestamps suficientes por agora).
