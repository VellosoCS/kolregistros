import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIncidents } from "./use-incidents";
import {
  computeMesAnaliseSuggestions,
  MesAnaliseLevel,
} from "@/lib/mes-analise-suggestions";

export interface MesAnaliseAlert {
  id: string;
  canonical_name: string;
  level: MesAnaliseLevel;
  total_count: number;
  breakdown: { type: string; count: number }[];
  variations: string[];
  created_at: string;
  is_read: boolean;
}

const ALERTS_KEY = ["mes-analise-alerts"] as const;

async function fetchAlerts(userId: string): Promise<MesAnaliseAlert[]> {
  const { data: alerts, error } = await supabase
    .from("mes_analise_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  const ids = (alerts ?? []).map((a) => a.id);
  let readSet = new Set<string>();
  if (ids.length > 0) {
    const { data: reads } = await supabase
      .from("mes_analise_alert_reads")
      .select("alert_id")
      .eq("user_id", userId)
      .in("alert_id", ids);
    readSet = new Set((reads ?? []).map((r) => r.alert_id));
  }

  return (alerts ?? []).map((a) => ({
    id: a.id,
    canonical_name: a.canonical_name,
    level: a.level as MesAnaliseLevel,
    total_count: a.total_count,
    breakdown: (a.breakdown as any) ?? [],
    variations: (a.variations as any) ?? [],
    created_at: a.created_at,
    is_read: readSet.has(a.id),
  }));
}

export function useMesAnaliseAlerts() {
  const { user, role } = useAuth();
  const enabled = !!user && role === "coordenacao";
  return useQuery({
    queryKey: [...ALERTS_KEY, user?.id],
    queryFn: () => fetchAlerts(user!.id),
    enabled,
    staleTime: 30_000,
  });
}

export function useUnreadMesAnaliseAlertsCount() {
  const { data = [] } = useMesAnaliseAlerts();
  return useMemo(() => data.filter((a) => !a.is_read).length, [data]);
}

export function useMesAnaliseAlertsRealtime() {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  useEffect(() => {
    if (!user || role !== "coordenacao") return;
    const channel = supabase
      .channel("mes-analise-alerts-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "mes_analise_alerts" }, () => {
        queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "mes_analise_alert_reads" }, () => {
        queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user, role]);
}

export function useMarkAlertRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("mes_analise_alert_reads")
        .upsert({ alert_id: alertId, user_id: user.id }, { onConflict: "alert_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ALERTS_KEY }),
  });
}

export function useMarkAllAlertsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data = [] } = useMesAnaliseAlerts();
  return useMutation({
    mutationFn: async () => {
      if (!user) return;
      const unread = data.filter((a) => !a.is_read);
      if (unread.length === 0) return;
      const rows = unread.map((a) => ({ alert_id: a.id, user_id: user.id }));
      const { error } = await supabase
        .from("mes_analise_alert_reads")
        .upsert(rows, { onConflict: "alert_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ALERTS_KEY }),
  });
}

/**
 * Watches incidents and inserts new alerts when professors reach a higher
 * Mês de Análise level than previously recorded. Only Coordenação runs this.
 * Insert is idempotent thanks to UNIQUE(canonical_name, level).
 */
export function useMesAnaliseAlertsAutomation() {
  const { user, role } = useAuth();
  const { data: incidents = [] } = useIncidents();
  const { data: existing = [] } = useMesAnaliseAlerts();

  useEffect(() => {
    if (!user || role !== "coordenacao") return;
    if (incidents.length === 0) return;

    const suggestions = computeMesAnaliseSuggestions(incidents);
    if (suggestions.length === 0) return;

    // Build set of (name|level) already alerted to skip duplicates
    const seen = new Set(existing.map((a) => `${a.canonical_name}|${a.level}`));

    const toInsert = suggestions
      .filter((s) => !seen.has(`${s.canonicalName}|${s.level}`))
      .map((s) => ({
        canonical_name: s.canonicalName,
        level: s.level,
        total_count: s.totalCount,
        breakdown: s.byType,
        variations: s.variations,
      }));

    if (toInsert.length === 0) return;

    void supabase
      .from("mes_analise_alerts")
      .upsert(toInsert, { onConflict: "canonical_name,level", ignoreDuplicates: true })
      .then(() => {});
  }, [incidents, existing, user, role]);
}
