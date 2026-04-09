

## Sistema de Login com 3 Papéis (Atualizado)

### Resumo
Implementar autenticação com 3 contas fixas, cada uma com funcionalidades diferentes conforme seu papel.

### Papéis
- **Coordenação** — acesso total
- **Suporte** (anteriormente "Suporte ao Professor") — acesso ao modo "professor"
- **Suporte ao Aluno** — acesso apenas ao modo "professor" (sem acesso ao Controle Interno)

### Antes de implementar, preciso dos emails

- Email da **Coordenação**
- Email do **Suporte**
- Email do **Suporte ao Aluno**

### Banco de Dados

- Enum `app_role`: `coordenacao`, `suporte`, `suporte_aluno`
- Tabela `user_roles` (user_id, role) com RLS
- Tabela `profiles` (id, email, display_name) com trigger automático no signup
- Função `has_role()` (security definer) para verificar papéis sem recursão
- Atualizar RLS de `incidents` e `incident_comments` para exigir autenticação

### Permissões por Papel

| Funcionalidade | Coordenação | Suporte | Suporte Aluno |
|---|---|---|---|
| Ver incidentes | Todos | Só modo "professor" | Só modo "interno" |
| Criar incidentes | Ambos os modos | Só modo "professor" | Só modo "interno" |
| Relatórios | Todos | Seus dados | Seus dados |
| Mês de Análise | Sim | Não | Não |
| Exportar Excel/Sheets | Sim | Sim | Sim |
| Excluir incidentes | Sim | Não | Não |

### Páginas e Componentes

- **Criar**: `AuthContext.tsx`, `Login.tsx`, `ResetPassword.tsx`, `ProtectedRoute.tsx`
- **Editar**: `App.tsx` (rotas protegidas), `Index.tsx` (filtrar por papel), `IncidentForm.tsx` (restringir modo), Header (nome do usuário + sair)

### Detalhes Técnicos

- Login por email + senha (sem cadastro aberto)
- Contas criadas via migração SQL com papéis pré-atribuídos
- Confirmação de email desabilitada (contas fixas)
- Header exibe nome do papel logado e botão de logout
- Abas e formulários condicionais ao papel do usuário

