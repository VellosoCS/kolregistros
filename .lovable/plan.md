## Nova página: Acompanhamento do Suporte

### Objetivo
Criar uma página em branco acessível via botão no header chamado "Acompanhamento do Suporte".

### Implementação

1. **Criar página `src/pages/AcompanhamentoSuporte.tsx`**
   - Página vazia com layout mínimo (header com título e botão "Voltar").
   - Estrutura similar às páginas existentes (Reports, MesAnalise).

2. **Adicionar rota em `src/App.tsx`**
   - Nova rota `/acompanhamento-suporte`.
   - Lazy import da página.
   - Protegida por `ProtectedRoute` com permissões para `coordenacao` e `suporte`.

3. **Adicionar botão no header `src/components/IndexHeader.tsx`**
   - Botão com ícone `Headset` (ou similar) e label "Acompanhamento do Suporte".
   - Exibição condicional com prop `canSeeAcompanhamentoSuporte`.
   - Posicionado junto aos outros links de navegação (Relatórios, Caixa de Entrada etc.).
   - Versão desktop e mobile do menu.

4. **Atualizar `src/pages/Index.tsx`**
   - Passar a prop `canSeeAcompanhamentoSuporte` para o `<IndexHeader>`.

### Permissões
- A página será visível para papéis `coordenacao` e `suporte` (mesmo padrão de relatórios/caixa de entrada).