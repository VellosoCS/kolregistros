import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogIn } from "lucide-react";
import logoKing from "@/assets/logo-king.png";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("rememberMe") === "true");
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!rememberMe) {
      // When not remembering, use sessionStorage so session expires when browser closes
      await supabase.auth.setSession({ access_token: '', refresh_token: '' }).catch(() => {});
    }

    localStorage.setItem("rememberMe", rememberMe ? "true" : "false");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error("Credenciais inválidas. Verifique email e senha.");
      setLoading(false);
      return;
    }

    if (!rememberMe) {
      // Move session to sessionStorage so it clears when browser closes
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        sessionStorage.setItem("sb-session", JSON.stringify(session));
      }
    }

    toast.success("Login realizado com sucesso!");
    navigate("/", { replace: true });
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Informe seu email.");
      return;
    }
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (error) {
      toast.error("Erro ao enviar email de redefinição.");
      return;
    }
    toast.success("Email de redefinição enviado! Verifique sua caixa de entrada.");
    setForgotMode(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={logoKing} alt="KoL" className="h-10 w-auto" />
            <h1 className="text-2xl font-bold text-foreground">NEXUS</h1>
          </div>
          <p className="text-muted-foreground text-sm">Sistema de Registro de Incidentes</p>
        </div>

        {forgotMode ? (
          <form onSubmit={handleForgotPassword} className="space-y-4 bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground">Informe seu email para receber o link de redefinição de senha.</p>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="seu@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {forgotLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              ) : (
                "Enviar link de redefinição"
              )}
            </button>
            <button type="button" onClick={() => setForgotMode(false)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              Voltar ao login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4 bg-card border border-border rounded-lg p-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="••••••••"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground">Permanecer conectado</span>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar
                </>
              )}
            </button>
            <button type="button" onClick={() => setForgotMode(true)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
              Esqueci minha senha
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
