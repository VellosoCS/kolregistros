

## Botão "Esqueci minha senha" com Aviso de Contato

Adicionar um botão abaixo do formulário de login que, ao ser clicado, exibe um alerta informando o usuário para entrar em contato com o Coordenador Caio Velloso para solicitar uma nova senha.

### Alteração

**`src/pages/Login.tsx`**
- Adicionar um botão de texto "Esqueci minha senha" logo após o botão "Entrar"
- Ao clicar, exibir um `toast.info` (ou um dialog simples) com a mensagem: *"Para redefinir sua senha, entre em contato com o Coordenador Caio Velloso."*
- Usar `toast.info()` do Sonner para manter a consistência visual (sem necessidade de modal extra)

