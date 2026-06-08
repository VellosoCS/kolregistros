import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Incident } from "@/lib/types";
import { rowToIncident } from "@/lib/incidents-store";

export interface TeacherTracking {
  id: string;
  teacher_name: string;
  first_message_sent: boolean;
  first_message_date: string | null;
  problem_resolved: boolean;
  second_message_sent: boolean;
  second_message_date: string | null;
  next_message_due: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherMeeting {
  id: string;
  teacher_id: string;
  coordinator_id: string | null;
  coordinator_name: string;
  meeting_date: string;
  notes: string | null;
  created_at: string;
}

export function useTeacherTracking() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`teacher-tracking-rt-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "teacher_tracking" }, () => {
        qc.invalidateQueries({ queryKey: ["teacher-tracking"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "teacher_meetings" }, () => {
        qc.invalidateQueries({ queryKey: ["teacher-meetings"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery<TeacherTracking[]>({
    queryKey: ["teacher-tracking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_tracking")
        .select("*")
        .order("teacher_name", { ascending: true });
      if (error) throw new Error(error.message);
      return (data as TeacherTracking[]) || [];
    },
  });
}

export function useTeacherIncidents(teacherName: string | null) {
  return useQuery<Incident[]>({
    queryKey: ["teacher-incidents", teacherName],
    enabled: !!teacherName,
    queryFn: async () => {
      if (!teacherName) return [];
      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .eq("incident_mode", "interno")
        .ilike("teacher_name", teacherName.trim())
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return (data || []).map(rowToIncident);
    },
  });
}

export function useTeacherMeetings(teacherId: string | null) {
  return useQuery<TeacherMeeting[]>({
    queryKey: ["teacher-meetings", teacherId],
    enabled: !!teacherId,
    queryFn: async () => {
      if (!teacherId) return [];
      const { data, error } = await supabase
        .from("teacher_meetings")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("meeting_date", { ascending: false });
      if (error) throw new Error(error.message);
      return (data as TeacherMeeting[]) || [];
    },
  });
}

export function useUpdateTeacherTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<TeacherTracking> }) => {
      const { error } = await supabase.from("teacher_tracking").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-tracking"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useBulkUpdateTeacherTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, patch }: { ids: string[]; patch: Partial<TeacherTracking> }) => {
      if (ids.length === 0) return;
      const { error } = await supabase.from("teacher_tracking").update(patch).in("id", ids);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["teacher-tracking"] });
      toast.success(`${vars.ids.length} professor(es) atualizado(s).`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

export function useAddTeacherMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      teacher_id: string;
      coordinator_id: string | null;
      coordinator_name: string;
      meeting_date: string;
      notes: string | null;
    }) => {
      const { error } = await supabase.from("teacher_meetings").insert(input);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["teacher-meetings", vars.teacher_id] });
      toast.success("Reunião registrada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Teachers whose next message due date is today or in the past (and problem not resolved). */
export function useTeachersDueAlerts() {
  const { data = [] } = useTeacherTracking();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return data.filter((t) => {
    if (t.problem_resolved) return false;
    if (!t.next_message_due) return false;
    const due = new Date(t.next_message_due + "T00:00:00");
    return due.getTime() <= today.getTime();
  });
}
