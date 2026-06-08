## Objetivo
Evitar quebra e estouro horizontal da tabela em `/acompanhamento-suporte` em telas menores, mantendo o alinhamento entre cabeçalho e células.

## Estratégia
Manter uma tabela única, com `min-width` consistente, scroll horizontal contínuo dentro do container e duas otimizações principais para reduzir a necessidade desse scroll em telas pequenas:

1. **Tabela com largura mínima + scroll horizontal suave** no container já existente (`overflow-x-auto`), garantindo que nada estoure o card e que o cabeçalho continue alinhado às células (mesmo `min-width` aplicado a header/rows via `table-fixed` + larguras por coluna).
2. **Colunas com largura fixa por classe Tailwind**, definidas tanto no `<TableHead>` quanto no `<TableCell>` correspondente — isso garante alinhamento perfeito em qualquer viewport.
3. **Compactação progressiva em telas menores**:
   - Em `<md` (mobile/tablet): esconder colunas redundantes "Data 1ª Msg" e "Data 2ª Msg" (a data continua acessível pelo popover do checkbox via ícone) usando `hidden md:table-cell`.
   - Em `<lg`: esconder a coluna "Próxima prevista" (`hidden lg:table-cell`); a tag "Mensagem vencida" ao lado do nome do professor já comunica o status.
   - Texto do botão "Reunião" vira apenas ícone em `<sm` (`hidden sm:inline`).
   - Botões de filtro/pastas já usam `flex-wrap`; reforçar quebras adequadas e reduzir paddings em mobile.
4. **Coluna "Professor"** com `truncate` + `max-w` para evitar nomes longos empurrando o layout.
5. **Selection bar** (`flex-wrap` já existe) — reforçar gap e tornar botões compactos em telas pequenas.

Nenhuma mudança de lógica, dados ou estilo visual além de responsividade. Sem novas dependências.

## Arquivos a editar
- `src/pages/AcompanhamentoSuporte.tsx`
  - Adicionar `table-fixed min-w-[900px]` ao `<Table>` e larguras explícitas a cada `<TableHead>`.
  - Aplicar classes `hidden md:table-cell` / `hidden lg:table-cell` às colunas opcionais em header **e** em cada `<TableCell>` correspondente em `TeacherRow`.
  - `truncate` + `max-w-[180px]` no nome do professor; `whitespace-nowrap` em datas.
  - Esconder rótulo "Reunião" em `<sm` (manter ícone).
  - Ajustar `colSpan` das linhas de estado (loading/vazio/expandido) para refletir o número total de colunas (continua 10; colunas escondidas ainda contam no DOM).

## Critérios de aceite
- Em viewport ~360–768px: sem scroll horizontal da página; tabela rola horizontalmente apenas se necessário, dentro do card.
- Cabeçalho sempre alinhado às células abaixo, em qualquer largura.
- Nenhum texto/botão "vaza" para fora do card.
- Funcionalidade (seleção, marcação, reunião, pastas) inalterada.
