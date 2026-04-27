import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/contexts/AuthContext";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface UserRow {
  user_id: string;
  display_name: string | null;
  email: string;
  role: AppRole | null;
  status: ApprovalStatus;
  created_at: string;
  approved_at: string | null;
  approved_by_name: string | null;
  last_sign_in_at: string | null;
}

const ALL_USERS_KEY = ["all-users"];

async function fetchAllUsers(): Promise<UserRow[]> {
  // Fonte primária: pending_approvals (contém status, role atribuído, datas e nome)
  const [{ data: approvals, error: aErr }, { data: profiles, error: pErr }, { data: roles, error: rErr }] =
    await Promise.all([
      supabase
        .from("pending_approvals")
        .select("user_id, email, display_name, status, created_at, approved_at, approved_by, assigned_role")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, email, display_name, last_sign_in_at, created_at"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

  if (aErr) throw aErr;
  if (pErr) throw pErr;
  if (rErr) throw rErr;

  const profileById = new Map((profiles || []).map((p) => [p.user_id, p]));
  const roleById = new Map((roles || []).map((r) => [r.user_id, r.role as AppRole]));

  // Resolve nome de quem aprovou
  const approverIds = Array.from(
    new Set((approvals || []).map((a) => a.approved_by).filter((v): v is string => !!v))
  );
  const approverNameById = new Map<string, string>();
  if (approverIds.length > 0) {
    const { data: approverProfiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", approverIds);
    (approverProfiles || []).forEach((p) =>
      approverNameById.set(p.user_id, p.display_name || p.email || "")
    );
  }

  const rows: UserRow[] = (approvals || []).map((a) => {
    const profile = profileById.get(a.user_id);
    return {
      user_id: a.user_id,
      display_name: profile?.display_name || a.display_name || null,
      email: profile?.email || a.email,
      role: (a.assigned_role as AppRole | null) || roleById.get(a.user_id) || null,
      status: a.status as ApprovalStatus,
      created_at: a.created_at,
      approved_at: a.approved_at,
      approved_by_name: a.approved_by ? approverNameById.get(a.approved_by) || null : null,
      last_sign_in_at: profile?.last_sign_in_at || null,
    };
  });

  return rows;
}

export function useAllUsers() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ALL_USERS_KEY, queryFn: fetchAllUsers, staleTime: 30_000 });

  useEffect(() => {
    const channel = supabase
      .channel("all-users-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "pending_approvals" }, () => {
        qc.invalidateQueries({ queryKey: ALL_USERS_KEY });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        qc.invalidateQueries({ queryKey: ALL_USERS_KEY });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => {
        qc.invalidateQueries({ queryKey: ALL_USERS_KEY });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}
