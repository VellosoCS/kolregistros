import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import logoKing from "@/assets/logo-king.png";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("rememberMe") === "true");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    localStorage.setItem("rememberMe", rememberMe ? "true" : "false");
    if (!rememberMe) {
      sessionStorage.setItem("session-active", "true");
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Email ou senha inválidos.");
      setLoading(false);
      return;
    }
    toast.success("Login realizado com sucesso!");
    navigate("/", { replace: true });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-card shadow-lg border border-border/50 mb-5">
            <img src={logoKing} alt="KoL" className="h-12 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">NEXUS</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Sistema de Registro de Incidentes</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-lg backdrop-blur-sm animate-slide-up">
          <h2 className="text-lg font-semibold text-foreground mb-6">Entrar na sua conta</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="flex h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring accent-primary"
                />
                <span className="text-sm text-muted-foreground">Lembrar-me</span>
              </label>
              <button
                type="button"
                onClick={() => toast.info("Para redefinir sua senha, entre em contato com o Coordenador Caio Velloso.")}
                className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Esqueci a senha
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 shadow-primary-glow"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8 animate-fade-in">
          KoL — Knowledge of Languages © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
