import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Incident } from "@/lib/types";
import { rowToIncident } from "@/lib/incidents-store";

export interface Delegation {
  id: string;
  incident_id: string;
  delegated_to: string;
  delegated_by: string;
  delegated_to_name: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface DelegationWithIncident extends Delegation {
  incident: Incident | null;
}

export const INBOX_KEY = ["inbox-delegations"];
export const UNREAD_KEY = ["inbox-unread-count"];

/** Caixa de entrada do usuário logado (delegações recebidas) */
export function useInboxDelegations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...INBOX_KEY, user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<DelegationWithIncident[]> => {
      const { data: delegations, error } = await supabase
        .from("incident_delegations")
        .select("*")
        .eq("delegated_to", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const list = (delegations || []) as Delegation[];
      if (list.length === 0) return [];

      const incidentIds = Array.from(new Set(list.map((d) => d.incident_id)));
      const { data: incidents } = await supabase
        .from("incidents")
        .select("*")
        .in("id", incidentIds);
      const incidentMap = new Map<string, Incident>();
      (incidents || []).forEach((row) => {
        const inc = rowToIncident(row);
        incidentMap.set(inc.id, inc);
      });

      return list.map((d) => ({ ...d, incident: incidentMap.get(d.incident_id) || null }));
    },
  });
}

/** Contagem de não lidos para o badge do sino */
export function useUnreadDelegationsCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...UNREAD_KEY, user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("incident_delegations")
        .select("*", { count: "exact", head: true })
        .eq("delegated_to", user!.id)
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
  });
}

/** Realtime: invalida queries quando chega/atualiza/remove delegação para mim */
export function useDelegationsRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`delegations_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incident_delegations",
          filter: `delegated_to=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: INBOX_KEY });
          queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}

/** Marca uma delegação como lida */
export function useMarkDelegationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (delegationId: string) => {
      const { error } = await supabase
        .from("incident_delegations")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", delegationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
    },
  });
}

/** Marca todas as delegações do usuário como lidas */
export function useMarkAllDelegationsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("incident_delegations")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("delegated_to", user.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
    },
  });
}

/** Cria delegações para um incidente (utilitário usado após salvar incidente) */
export async function createDelegations(
  incidentId: string,
  delegatedBy: string,
  recipients: { user_id: string; display_name: string | null }[]
) {
  if (recipients.length === 0) return;
  const rows = recipients.map((r) => ({
    incident_id: incidentId,
    delegated_to: r.user_id,
    delegated_by: delegatedBy,
    delegated_to_name: r.display_name,
  }));
  const { error } = await supabase.from("incident_delegations").insert(rows);
  if (error) throw error;
}
