

## Plano: Integração Google Sheets via endpoint público (IMPORTDATA)

### Abordagem

Em vez de configurar Service Account e credenciais, criar um **endpoint público** (edge function) que retorna os incidentes em formato CSV. No Google Sheets, o usuário usa a fórmula `=IMPORTDATA("url")` para puxar os dados automaticamente. O Google atualiza o cache a cada ~1 hora.

Um botão **"Google Sheets"** ao lado de "Exportar Excel" abrirá um dialog explicando como usar, com o link do endpoint pronto para copiar.

### Vantagens
- Zero configuração de credenciais
- Funciona com qualquer conta Google
- Atualização automática (~1h de cache do Google)
- O usuário só precisa colar a fórmula uma vez

### Implementação

**1. Edge Function `export-csv`**
- Endpoint público GET que consulta a tabela `incidents` e retorna CSV
- Suporta query params opcionais para filtros (ex: `?resolved=false`)
- Headers: `Content-Type: text/csv; charset=utf-8`
- Sem autenticação necessária (dados já são públicos para o app)

**2. Botão + Dialog no frontend (`Index.tsx`)**
- Botão "Google Sheets" com ícone ao lado de "Exportar Excel"
- Ao clicar, abre um dialog com:
  - O link do endpoint CSV (copiável com um clique)
  - Instrução: "Cole esta fórmula no Google Sheets: `=IMPORTDATA("url")`"
  - Nota: "Os dados atualizam automaticamente a cada ~1 hora"
  - Botão para copiar a fórmula

### Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/functions/export-csv/index.ts` | Criar — retorna incidentes como CSV |
| `src/pages/Index.tsx` | Editar — adicionar botão e dialog |
| `src/components/GoogleSheetsDialog.tsx` | Criar — dialog com instruções e link |

### Detalhes técnicos

A edge function usa o service role key para ler todos os incidentes, formata como CSV com as mesmas colunas do Excel (Urgência, Professor, Responsável, Tipo, Descrição, Solução, Acompanhamento, Resolvido, Data), e retorna com encoding UTF-8 + BOM para compatibilidade com caracteres acentuados.

