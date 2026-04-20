import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Mail, Lock, User, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const signupSchema = z.object({
  displayName: z.string().trim().min(2, "Informe seu nome (mínimo 2 caracteres)").max(100, "Nome muito longo"),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").max(72, "Senha muito longa"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

export default function SignUp() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = signupSchema.safeParse({ displayName, email, password, confirmPassword });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          display_name: parsed.data.displayName,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("user already")) {
        toast.error("Este email já está cadastrado.");
      } else {
        toast.error(error.message || "Erro ao criar conta.");
      }
      setLoading(false);
      return;
    }

    // Sign out immediately — user must wait for approval
    await supabase.auth.signOut();
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="w-full max-w-[420px] relative z-10">
          <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-lg backdrop-blur-sm text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Conta criada!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Sua solicitação foi registrada e está aguardando aprovação da Coordenação. Você receberá acesso assim que sua conta for validada.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Ir para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">KING NEXUS</h1>
          <p className="text-muted-foreground text-sm mt-1.5">Criar nova conta</p>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-lg backdrop-blur-sm animate-slide-up">
          <h2 className="text-lg font-semibold text-foreground mb-2">Solicitar acesso</h2>
          <p className="text-xs text-muted-foreground mb-6">
            Após o cadastro, sua conta ficará pendente até ser aprovada pela Coordenação.
          </p>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Nome completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="flex h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="flex h-11 w-full rounded-xl border border-border bg-background pl-10 pr-10 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  placeholder="Mínimo 8 caracteres"
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="flex h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  placeholder="Repita a senha"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 shadow-primary-glow"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Criar conta
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link to="/login" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
              Já tem conta? Entrar
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground mt-8 animate-fade-in space-y-1">
          <p>KoL — King of Languages © {new Date().getFullYear()}</p>
          <p>Criado por Caio Velloso</p>
        </div>
      </div>
    </div>
  );
}
