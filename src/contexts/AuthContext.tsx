import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "coordenacao" | "suporte" | "suporte_aluno";

interface AuthContextType {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  displayName: string;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  displayName: "",
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const ROLE_LABELS: Record<AppRole, string> = {
  coordenacao: "Coordenação",
  suporte: "Suporte",
  suporte_aluno: "Suporte ao Aluno",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    return (data?.role as AppRole) || null;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          setTimeout(async () => {
            const userRole = await fetchRole(currentUser.id);
            setRole(userRole);
            setLoading(false);
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    // Session persistence logic
    const rememberMe = localStorage.getItem("rememberMe");
    if (rememberMe === "true") {
      const expiry = Number(localStorage.getItem("rememberMeExpiry") || "0");
      if (expiry && Date.now() > expiry) {
        // 7-day window expired — sign out
        localStorage.removeItem("rememberMeExpiry");
        supabase.auth.signOut();
      } else {
        // Still within 7 days — force token refresh to keep session alive
        supabase.auth.getSession();
      }
    } else if (rememberMe === "false") {
      const isReturning = !sessionStorage.getItem("session-active");
      if (isReturning) {
        supabase.auth.signOut();
      } else {
        sessionStorage.setItem("session-active", "true");
      }
    } else {
      sessionStorage.setItem("session-active", "true");
    }

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  const displayName = role ? ROLE_LABELS[role] : "";

  return (
    <AuthContext.Provider value={{ user, role, loading, displayName, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
