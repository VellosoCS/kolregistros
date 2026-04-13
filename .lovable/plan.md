

## Plan: Garantir sessão de 1 semana com "Lembrar-me"

### Problema atual
Quando "Lembrar-me" está ativado, o Supabase usa o token de refresh padrão, mas não há controle explícito sobre a duração mínima da sessão. O token JWT expira conforme configuração do servidor (padrão: 1 hora para access token, 1 semana para refresh token no Supabase). Precisamos garantir que o refresh token seja renovado ativamente e que a lógica no `AuthContext` preserve a sessão.

### Mudanças

1. **`src/contexts/AuthContext.tsx`** — Quando `rememberMe === "true"`, salvar o timestamp do login e verificar se passou menos de 7 dias antes de permitir qualquer logout automático. Adicionar lógica de refresh ativo do token na inicialização quando "lembrar-me" está ativo.

2. **`src/pages/Login.tsx`** — Ao fazer login com "lembrar-me" ativado, salvar `localStorage.setItem("rememberMeExpiry", Date.now() + 7 * 24 * 60 * 60 * 1000)` para registrar a validade de 7 dias.

3. **`src/contexts/AuthContext.tsx`** — Na inicialização, se `rememberMe === "true"` e o expiry não passou, chamar `supabase.auth.getSession()` para forçar refresh do token, garantindo a sessão ativa. Se o expiry passou, fazer sign out.

### Detalhes técnicos
- O Supabase já persiste o refresh token no localStorage e faz auto-refresh do access token
- A camada adicional garante que mesmo após 7 dias sem uso, o usuário será deslogado
- Dentro dos 7 dias, o `autoRefreshToken: true` do client mantém a sessão viva automaticamente

