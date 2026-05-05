# Nova aba "Sugestão Mês de Análise" em Relatórios

Adicionar uma nova seção/aba na página de Relatórios (`/relatorios`) que analisa todos os incidentes e sugere quais professores deveriam ser colocados em "Mês de Análise", considerando apenas tipos de incidente classificados como feedback negativo.

## Regras de negócio

**Tipos de incidente contabilizados** (somente estes contam para a sugestão):
- No-Show
- Muitas pendências
- Muitas faltas
- Reclamação
- Profissionalismo
- Organização

Os demais tipos (Suporte, Didático, Plataforma, Mês de análise, Erros de lançamento, etc.) são ignorados nesta análise.

**Agrupamento por professor**: usa a mesma lógica de similaridade já existente em `MetricsDashboard.tsx` (Levenshtein + threshold 0.8) para agrupar nomes com pequenos erros de digitação ("João Silva" e "Joao Silva" viram um só).

**Critério de sugestão** (nível de prioridade):
- **Crítico**: 5+ incidentes negativos
- **Alerta**: 3–4 incidentes negativos
- **Observação**: 2 incidentes negativos
- Professores com 0 ou 1 incidente negativo não aparecem na lista

## Mudanças na UI

### `src/pages/Reports.tsx`
- Envolver o conteúdo atual em um componente de abas (`Tabs` do shadcn) com duas abas:
  - **"Visão Geral"** (conteúdo atual: dashboard, urgência, ranking, detalhes)
  - **"Sugestão Mês de Análise"** (nova)
- A nova aba usa **todos os incidentes do banco** (não filtrado pelo período da semana/mês), pois a análise é histórica/cumulativa. Vai ser carregado via hook existente `useIncidents()` (sem filtro de data).
- Esconder o seletor de período quando a aba ativa for a de sugestão (não faz sentido nela).

### Novo componente `src/components/MesAnaliseSuggestions.tsx`
Recebe `incidents: Incident[]` e renderiza:
- Texto explicativo curto: "Sugestões baseadas em incidentes dos tipos: No-Show, Muitas pendências, Muitas faltas, Reclamação, Profissionalismo, Organização."
- Cards de resumo: total de professores sugeridos, total em nível crítico, total em alerta.
- Lista ordenada por contagem decrescente, mostrando para cada professor:
  - Nome (canônico, mais frequente do grupo)
  - Badge de nível (Crítico/Alerta/Observação) com cores `urgency-high`/`urgency-medium`/`urgency-low`
  - Contagem total de incidentes negativos
  - Breakdown por tipo (ex.: "Reclamação ×3, No-Show ×2")
  - Data do incidente negativo mais recente
  - Variações de grafia detectadas (se houver mais de uma no grupo), em texto pequeno secundário
- Botão por linha "Ver incidentes" que abre um `Dialog` listando todos os incidentes negativos contabilizados daquele professor (data, tipo, urgência, descrição curta).
- Estado vazio: "Nenhum professor atinge o critério mínimo de 2 incidentes negativos."

### `src/lib/mes-analise-suggestions.ts` (novo, lógica pura testável)
Função `computeMesAnaliseSuggestions(incidents)` que:
1. Filtra incidentes cujo `problemType` está na lista negativa (constante exportada `MES_ANALISE_TRIGGER_TYPES`).
2. Reaproveita a função de normalização por similaridade já existente em `MetricsDashboard.tsx` — extrair essa função para este novo arquivo e importar em ambos os lugares (evita duplicação).
3. Agrupa por nome canônico, calcula contagem total, breakdown por tipo, lista de variações, data mais recente.
4. Atribui nível (`critico` | `alerta` | `observacao`) conforme thresholds.
5. Retorna apenas grupos com ≥2 incidentes, ordenados por contagem desc.

### `MetricsDashboard.tsx`
Trocar a função local `normalizeTeacherNames` pela importada do novo arquivo compartilhado. Sem mudança de comportamento.

## Sem mudanças no banco
A funcionalidade é puramente derivada dos incidentes existentes — não precisa migration nem nova tabela.

## Fora de escopo (pode virar pedido futuro)
- Botão "Marcar como Mês de Análise" criando automaticamente um incidente do tipo "Mês de análise" — não foi pedido agora.
- Configuração dos thresholds (5/3/2) na UI — usados como constantes.
- Filtro por período na aba de sugestão.
