

## Plano: Página de Cadastro com Aprovação Manual por Email

### Objetivo
Criar uma página de **Criar Conta** acessível pela tela de login. Quando um novo usuário se registrar, a conta ficará **pendente de aprovação** e um email será enviado automaticamente para `caio.velloso.king@gmail.com` para validação manual. O usuário não conseguirá entrar até que você aprove e atribua um papel.

### Fluxo de Usuário

```text
[Login] --(link)--> [Criar Conta]
                          |
                  Email + Senha + Nome
                          |
                          v
              Cria conta (Supabase Auth)
                          |
                          v
              Status: PENDENTE (sem role)
                          |
                          v
        Email enviado para caio.velloso.king@gmail.com
        com botão "Aprovar Acesso"
                          |
                          v
        Você clica no botão → página de aprovação
                          |
                          v
        Escolhe o papel (Coordenação / Suporte / Suporte ao Aluno)
                          |
                          v
              Usuário pode fazer login normalmente
```

### Mudanças Planejadas

**1. Banco de dados (migration)**
- Nova tabela `pending_approvals`:
  - `id` (uuid, PK)
  - `user_id` (uuid, ref auth.users)
  - `email`, `display_name`
  - `status` ('pending' | 'approved' | 'rejected')
  - `approval_token` (uuid único, usado no link do email)
  - `created_at`, `approved_at`, `approved_by`
- RLS: apenas `coordenacao` consulta; inserção via edge function (service role).
- Atualizar trigger `handle_new_user`: cria `profile` mas NÃO cria `user_roles` automaticamente. Em vez disso, insere em `pending_approvals`.

**2. Lógica de Login (AuthContext)**
- Após login bem-sucedido, verificar se o usuário tem `role` em `user_roles`.
- Se não tiver role → bloquear acesso, exibir mensagem: *"Sua conta ainda está aguardando aprovação. Você receberá acesso após validação."* e fazer signOut.

**3. Nova página `/cadastro` (Sign Up)**
- Formulário: Nome completo, Email, Senha, Confirmar Senha.
- Validação client-side com Zod (email válido, senha mínima 8 caracteres).
- Chama `supabase.auth.signUp({ email, password, options: { data: { display_name } } })`.
- Após signup: chama edge function `notify-new-signup` que envia o email para você.
- Mostra mensagem de sucesso: *"Conta criada! Aguarde a aprovação do administrador."*
- Link "Já tem conta? Entrar" volta para `/login`.

**4. Atualizar página `/login`**
- Adicionar link **"Criar conta"** no rodapé do card de login.

**5. Edge Function `notify-new-signup`**
- Recebe: `userId`, `email`, `displayName`.
- Gera `approval_token` e salva em `pending_approvals`.
- Envia email para `caio.velloso.king@gmail.com` com:
  - Dados do solicitante (nome, email).
  - Link: `https://[app]/aprovar-acesso?token=[approval_token]`
  - Botão "Aprovar Acesso".
- Email enviado via **Lovable Cloud Email** (built-in, sem precisar de chave externa).
- ⚠️ **Pré-requisito**: precisa configurar um **domínio de email** no Lovable Cloud antes (botão de configuração será exibido na próxima execução).

**6. Nova página `/aprovar-acesso`**
- Pública (não exige login).
- Lê `?token=` da URL.
- Valida o token contra `pending_approvals`.
- Se válido + status pending: exibe dados do usuário e dropdown para escolher o papel:
  - Coordenação
  - Suporte
  - Suporte ao Aluno
- Botão "Aprovar e Atribuir Papel": insere em `user_roles` e marca `pending_approvals` como `approved`.
- Botão "Rejeitar": marca como `rejected` (e opcionalmente deleta o usuário do auth).
- Esta ação requer estar logado como `coordenacao` para evitar abuso.

### Detalhes Técnicos

- **Configuração de Auth**: Recomendo manter `confirm email = false` (auto-confirm) para o fluxo, já que a verificação é manual via email do admin. Se preferir, pode-se manter o confirm email do Supabase também.
- **Segurança**: O token de aprovação é uuid (não enumerável). Página de aprovação só funciona para `coordenacao` autenticado.
- **Email**: Será enviado via infraestrutura Lovable Cloud (transactional email). Será necessário primeiro configurar um domínio de envio (passo guiado).
- **Trigger**: O trigger `handle_new_user` será modificado para inserir uma linha em `pending_approvals` em vez de criar role automaticamente.

### Arquivos a Criar/Editar
- ✏️ `supabase/migrations/[timestamp].sql` — tabela `pending_approvals`, atualizar trigger, RLS.
- ✏️ `src/contexts/AuthContext.tsx` — bloquear login sem role.
- ✨ `src/pages/SignUp.tsx` — nova página de cadastro.
- ✨ `src/pages/AprovarAcesso.tsx` — página de aprovação manual.
- ✏️ `src/App.tsx` — registrar rotas `/cadastro` e `/aprovar-acesso`.
- ✏️ `src/pages/Login.tsx` — adicionar link "Criar conta".
- ✨ `supabase/functions/notify-new-signup/index.ts` — envia email de aprovação.
- ✨ `supabase/functions/_shared/transactional-email-templates/new-signup-approval.tsx` — template do email.

### Pré-requisito Importante
O envio do email exige que um **domínio de email** seja configurado no Lovable Cloud. Após você aprovar este plano, o primeiro passo será apresentar o diálogo de configuração de domínio. O domínio só precisa ser configurado uma vez, mas pode levar até 72h para verificação DNS — durante esse período, o cadastro funciona mas o email só é entregue após verificação completa.

