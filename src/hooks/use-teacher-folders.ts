import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TeacherFolder {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherFolderMember {
  folder_id: string;
  teacher_id: string;
  added_by: string | null;
  created_at: string;
}

export function useTeacherFolders() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`teacher-folders-rt-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "teacher_folders" }, () => {
        qc.invalidateQueries({ queryKey: ["teacher-folders"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "teacher_folder_members" }, () => {
        qc.invalidateQueries({ queryKey: ["teacher-folder-members"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery<TeacherFolder[]>({
    queryKey: ["teacher-folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_folders")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return (data as TeacherFolder[]) || [];
    },
  });
}

export function useTeacherFolderMembers() {
  return useQuery<TeacherFolderMember[]>({
    queryKey: ["teacher-folder-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teacher_folder_members").select("*");
      if (error) throw new Error(error.message);
      return (data as TeacherFolderMember[]) || [];
    },
  });
}

export function useCreateTeacherFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const clean = name.trim();
      if (!clean) throw new Error("Nome da pasta é obrigatório");
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("teacher_folders")
        .insert({ name: clean, created_by: user.user?.id ?? null })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as TeacherFolder;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-folders"] });
      toast.success("Pasta criada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRenameTeacherFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const clean = name.trim();
      if (!clean) throw new Error("Nome da pasta é obrigatório");
      const { error } = await supabase.from("teacher_folders").update({ name: clean }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-folders"] });
      toast.success("Pasta renomeada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTeacherFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teacher_folders").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-folders"] });
      qc.invalidateQueries({ queryKey: ["teacher-folder-members"] });
      toast.success("Pasta excluída.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddTeachersToFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ folderId, teacherIds }: { folderId: string; teacherIds: string[] }) => {
      if (teacherIds.length === 0) return;
      const { data: user } = await supabase.auth.getUser();
      const rows = teacherIds.map((teacher_id) => ({
        folder_id: folderId,
        teacher_id,
        added_by: user.user?.id ?? null,
      }));
      const { error } = await supabase.from("teacher_folder_members").upsert(rows, {
        onConflict: "folder_id,teacher_id",
        ignoreDuplicates: true,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["teacher-folder-members"] });
      toast.success(`${vars.teacherIds.length} professor(es) adicionado(s) à pasta.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveTeacherFromFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ folderId, teacherId }: { folderId: string; teacherId: string }) => {
      const { error } = await supabase
        .from("teacher_folder_members")
        .delete()
        .eq("folder_id", folderId)
        .eq("teacher_id", teacherId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-folder-members"] });
      toast.success("Professor removido da pasta.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
