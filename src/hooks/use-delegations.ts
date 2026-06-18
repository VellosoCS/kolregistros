import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Incident } from "@/lib/types";
import { rowToIncident } from "@/lib/incidents-store";

export type TaskStatus = "pending" | "accepted" | "in_progress" | "completed" | "declined";

export interface Delegation {
  id: string;
  incident_id: string;
  delegated_to: string;
  delegated_by: string;
  delegated_to_name: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  status: TaskStatus;
  accepted_at: string | null;
  completed_at: string | null;
  declined_at: string | null;
  due_date: string | null;
}

export interface DelegationWithIncident extends Delegation {
  incident: Incident | null;
  delegated_by_name?: string | null;
}

export const INBOX_KEY = ["inbox-delegations"];
export const UNREAD_KEY = ["inbox-unread-count"];
export const TASKS_KEY = ["my-tasks"];
export const PENDING_TASKS_KEY = ["my-tasks-pending-count"];

/**
 * Corte "ex nunc" das tarefas: apenas delegações criadas a partir do
 * primeiro acesso do usuário à área de Tarefas são consideradas.
 * O marco é salvo em localStorage por usuário e nunca recua.
 */
function getTasksCutoff(userId: string): string {
  const key = `tasks_cutoff_${userId}`;
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const now = new Date().toISOString();
    localStorage.setItem(key, now);
    return now;
  } catch {
    return new Date().toISOString();
  }
}


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

/** Tarefas do usuário logado, com nome de quem delegou. */
export function useMyTasks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...TASKS_KEY, user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<DelegationWithIncident[]> => {
      const cutoff = getTasksCutoff(user!.id);
      const { data: delegations, error } = await supabase
        .from("incident_delegations")
        .select("*")
        .eq("delegated_to", user!.id)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const list = (delegations || []) as Delegation[];
      if (list.length === 0) return [];

      const incidentIds = Array.from(new Set(list.map((d) => d.incident_id)));
      const delegatorIds = Array.from(new Set(list.map((d) => d.delegated_by)));

      const [incidentsRes, profilesRes] = await Promise.all([
        supabase.from("incidents").select("*").in("id", incidentIds),
        supabase.from("profiles").select("user_id, display_name, email").in("user_id", delegatorIds),
      ]);

      const incidentMap = new Map<string, Incident>();
      (incidentsRes.data || []).forEach((row) => {
        const inc = rowToIncident(row);
        incidentMap.set(inc.id, inc);
      });
      const profileMap = new Map<string, string>();
      (profilesRes.data || []).forEach((p) => {
        profileMap.set(p.user_id, p.display_name || p.email || "—");
      });

      return list.map((d) => ({
        ...d,
        incident: incidentMap.get(d.incident_id) || null,
        delegated_by_name: profileMap.get(d.delegated_by) || null,
      }));
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

/** Contagem de tarefas pendentes (status='pending') para o badge */
export function usePendingTasksCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...PENDING_TASKS_KEY, user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<number> => {
      const cutoff = getTasksCutoff(user!.id);
      const { count, error } = await supabase
        .from("incident_delegations")
        .select("*", { count: "exact", head: true })
        .eq("delegated_to", user!.id)
        .eq("status", "pending")
        .gte("created_at", cutoff);
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
          queryClient.invalidateQueries({ queryKey: TASKS_KEY });
          queryClient.invalidateQueries({ queryKey: PENDING_TASKS_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}

/**
 * Toast global ao receber NOVA delegação pendente em tempo real.
 * Dispara `onOpenTask(delegationId)` quando o usuário clica em "Ver".
 */
export function usePendingTaskToasts(onOpenTask: (delegationId: string) => void) {
  const { user } = useAuth();
  const seenIds = useRef<Set<string>>(new Set());
  const onOpenRef = useRef(onOpenTask);
  onOpenRef.current = onOpenTask;

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    // Hidrata IDs já existentes para não disparar toast em delegações antigas
    (async () => {
      const { data } = await supabase
        .from("incident_delegations")
        .select("id")
        .eq("delegated_to", user.id);
      if (!mounted) return;
      (data || []).forEach((d) => seenIds.current.add(d.id));
    })();

    const channel = supabase
      .channel(`task_toasts_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "incident_delegations",
          filter: `delegated_to=eq.${user.id}`,
        },
        async (payload) => {
          const row = payload.new as Delegation;
          if (seenIds.current.has(row.id)) return;
          seenIds.current.add(row.id);
          if (row.status !== "pending") return;

          // Busca dados do incidente p/ mostrar contexto no toast
          const { data: inc } = await supabase
            .from("incidents")
            .select("teacher_name, problem_type, urgency")
            .eq("id", row.incident_id)
            .maybeSingle();

          const { toast } = await import("sonner");
          toast(`Nova tarefa: ${inc?.problem_type ?? "Incidente"}`, {
            description: inc ? `${inc.teacher_name} • ${inc.urgency}` : "Você recebeu uma nova delegação.",
            duration: 12000,
            closeButton: true,
            action: {
              label: "Ver",
              onClick: () => onOpenRef.current(row.id),
            },
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
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

/** Atualiza o status de uma tarefa (delegação). */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const { error } = await supabase
        .from("incident_delegations")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY });
      queryClient.invalidateQueries({ queryKey: INBOX_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
      queryClient.invalidateQueries({ queryKey: PENDING_TASKS_KEY });
    },
  });
}

/** Cria delegações para um incidente (utilitário usado após salvar incidente) */
export async function createDelegations(
  incidentId: string,
  delegatedBy: string,
  recipients: { user_id: string; display_name: string | null }[],
  dueDate?: string | null
) {
  if (recipients.length === 0) return;
  const rows = recipients.map((r) => ({
    incident_id: incidentId,
    delegated_to: r.user_id,
    delegated_by: delegatedBy,
    delegated_to_name: r.display_name,
    due_date: dueDate ?? null,
  }));
  const { error } = await supabase.from("incident_delegations").insert(rows);
  if (error) throw error;
}
