## Objetivo
Adicionar marcação "Em análise" por incidente, indicando que o caso foi encaminhado ao setor responsável, com ícone visível e filtro dedicado.

## Mudanças propostas

### 1. Banco de dados
- Adicionar coluna `under_analysis` (boolean, default `false`) na tabela `incidents`.
- Migração via tool de migração (sem mexer em RLS — políticas atuais já cobrem update por papel).

### 2. Tipos / Store
- `src/lib/types.ts`: adicionar `underAnalysis: boolean` ao `Incident`.
- `src/lib/incidents-store.ts`:
  - `rowToIncident` / `incidentToRow`: mapear `under_analysis ↔ underAnalysis`.
  - `PaginationParams`: novo filtro opcional `underAnalysis?: boolean`.
  - `getIncidentsPaginated`: aplicar `.eq("under_analysis", true)` quando ativo.

### 3. UI — botão e ícone na linha
`src/components/incident-list/IncidentTableRow.tsx`:
- Novo botão na coluna de ações: rótulo "Em análise" (ícone `AlertTriangle` da lucide), com tooltip. Clica → alterna `underAnalysis`.
- Quando `underAnalysis = true`, mostrar badge/ícone de aviso visível ao lado do tipo de problema (estilo similar ao lembrete de 30 dias: pílula âmbar com `AlertTriangle` + texto "Em análise").
- Estado ativo do botão estilizado (cor âmbar) para feedback.

### 4. Handler de atualização
- `src/components/IncidentList.tsx` (ou hook correspondente): nova prop/handler `onToggleUnderAnalysis(id)` que chama `updateIncident` invertendo o flag, com toast de confirmação e refresh otimista.

### 5. Filtro
`src/components/incident-list/IncidentFilters.tsx`:
- Adicionar botão pill "⚠️ Em análise" (mesmo padrão do "🔔 Acompanhamento pendente"), com props `filterUnderAnalysis` e `onFilterUnderAnalysisChange`.
- Propagar estado pelo `IncidentList` até a query paginada.

### 6. Memória do projeto
- Atualizar `mem://features/incidentes/acompanhamento` (ou criar `mem://features/incidentes/em-analise`) documentando o novo flag, semântica visual (âmbar) e disponibilidade do filtro.

## Fora do escopo
- Não altera sugestões de "Mês de análise" nem o fluxo de delegação.
- Não envia notificação automática ao setor — apenas marca visualmente.
- Sem mudança no relatório PDF/DOCX/BBCode (pode ser feito depois se desejado).

## Pergunta rápida
O botão "Em análise" deve estar disponível para **todos os papéis** com permissão de editar incidentes (coordenação, suporte, suporte_aluno), ou restrito a algum perfil específico?
