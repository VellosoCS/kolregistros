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
          const userRole = await fetchRole(currentUser.id);
          setRole(userRole);
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const userRole = await fetchRole(currentUser.id);
        setRole(userRole);
      }
      setLoading(false);
    });

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
