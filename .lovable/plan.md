## Objetivo

Criar uma página interna **/usuarios** acessível apenas pela Coordenação, listando todos os usuários cadastrados (aprovados, pendentes e rejeitados) com botão para exportar a lista em Excel ou CSV. A lista é sempre atual quando aberta — não há arquivo "vivo" no disco; o arquivo é gerado na hora com os dados do momento.

**Importante sobre senhas:** senhas não são exportadas porque o backend não as armazena em texto — apenas hashes irreversíveis. Esse é o comportamento correto e seguro de qualquer sistema de autenticação. Se algum usuário esquecer a senha, o caminho é "redefinir senha" pela tela de login, não recuperar a antiga.

## O que será construído

### 1. Registro de "último acesso" (backend)
- Nova coluna `last_sign_in_at` em `profiles` (timestamp).
- Atualização disparada do frontend logo após cada login bem-sucedido (no `AuthContext`, dentro do `onAuthStateChange` quando o evento for `SIGNED_IN`).
- Política RLS já existente permite que o próprio usuário atualize seu profile, então não há mudança de RLS necessária.

### 2. Página `/usuarios` (Coordenação apenas)
- Nova rota protegida em `src/App.tsx`, usando `ProtectedRoute` com role `coordenacao`.
- Link no menu/`IndexHeader` visível apenas para Coordenação.
- Layout consistente com `/aprovacoes` e `/caixa` (mesmo padrão visual).

### 3. Tabela de usuários
Colunas exibidas:
- **Nome** (display_name)
- **Email**
- **Papel** (Coordenação / Suporte / Suporte ao Aluno) — badge colorido
- **Status** (Aprovado / Pendente / Rejeitado) — badge
- **Cadastro** (data de criação)
- **Aprovado por / em** (quando aplicável)
- **Último acesso** (ou "Nunca acessou")

Funcionalidades:
- Busca por nome ou email
- Filtros por papel e por status
- Ordenação por coluna (clicar no cabeçalho)
- Atualização em tempo real (Supabase Realtime nas tabelas `profiles`, `pending_approvals` e `user_roles`) — qualquer mudança aparece sem precisar recarregar

### 4. Botão "Exportar"
Dropdown com duas opções:
- **Exportar Excel (.xlsx)** — gerado no cliente com SheetJS, incluindo todas as colunas, cabeçalho destacado e auto-filtro
- **Exportar CSV** — para abrir em qualquer planilha

O arquivo reflete os filtros/busca aplicados no momento (se nenhum filtro estiver ativo, exporta todos).

Nome do arquivo: `usuarios_kol_AAAA-MM-DD.xlsx`.

## Como ficará atualizado

- Ao **abrir a página**: lista carregada do banco (sempre atual).
- Enquanto a página está **aberta**: Realtime atualiza a tabela automaticamente quando alguém é aprovado, rejeitado, faz login, etc.
- Ao **clicar em Exportar**: gera o arquivo na hora com o estado atual.

Não fica nenhum arquivo "estagnado" em lugar nenhum — toda exportação é fresca.

## Detalhes técnicos

**Arquivos a criar:**
- `src/pages/Usuarios.tsx` — página principal
- `src/hooks/use-all-users.ts` — busca consolidada de `pending_approvals` + `profiles` + `user_roles` com Realtime
- `src/lib/users-export.ts` — gera XLSX/CSV via SheetJS (`xlsx` já costuma estar disponível ou será adicionada)

**Arquivos a editar:**
- `src/App.tsx` — registrar rota `/usuarios` protegida
- `src/components/IndexHeader.tsx` — adicionar link "Usuários" para Coordenação
- `src/contexts/AuthContext.tsx` — gravar `last_sign_in_at` no evento `SIGNED_IN`

**Migração de banco:**
- `ALTER TABLE profiles ADD COLUMN last_sign_in_at timestamptz;`

**Dependência:**
- Adicionar `xlsx` (SheetJS) se ainda não estiver no projeto.

## Fora do escopo (e por quê)

- **Senhas no arquivo** — tecnicamente impossível, ver explicação acima.
- **Geração automática agendada (cron)** — você escolheu a opção "página + botão", mais simples e sempre atualizada na hora.
- **Link CSV para Google Sheets** — pode ser adicionado depois se virar necessidade; hoje fica fora.
