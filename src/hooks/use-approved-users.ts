import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ApprovedUser {
  user_id: string;
  display_name: string | null;
  email: string | null;
  role: "coordenacao" | "suporte" | "suporte_aluno";
}

export const APPROVED_USERS_KEY = ["approved-users"];

export function useApprovedUsers() {
  return useQuery({
    queryKey: APPROVED_USERS_KEY,
    queryFn: async (): Promise<ApprovedUser[]> => {
      const { data, error } = await supabase
        .from("approved_users")
        .select("user_id, display_name, email, role")
        .order("display_name", { ascending: true });
      if (error) throw error;
      return (data || []) as ApprovedUser[];
    },
    staleTime: 5 * 60 * 1000, // 5 min — lista muda raramente
  });
}

/** Normaliza um nome em handle: "Caio Velloso" -> "caiovelloso" */
export function nameToHandle(name: string | null | undefined, fallbackEmail?: string | null): string {
  const base = (name || fallbackEmail?.split("@")[0] || "usuario").toString();
  return base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
