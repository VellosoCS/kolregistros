import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Incident } from "@/lib/types";
import { getIncidents, saveIncident, updateIncident, deleteIncident, getFollowUps } from "@/lib/incidents-store";
import { uploadIncidentImages, deleteIncidentImages } from "@/lib/image-upload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const INCIDENTS_KEY = ["incidents"] as const;
const FOLLOW_UPS_KEY = ["follow-ups"] as const;

/**
 * Subscribes to realtime changes on the incidents table.
 * Call once at app level so every page sharing the cache stays updated.
 */
export function useIncidentsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("incidents-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incidents" },
        () => {
          queryClient.invalidateQueries({ queryKey: INCIDENTS_KEY });
          queryClient.invalidateQueries({ queryKey: FOLLOW_UPS_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useIncidents() {
  return useQuery({
    queryKey: INCIDENTS_KEY,
    queryFn: getIncidents,
    staleTime: 30_000,
  });
}

export function useFollowUps() {
  return useQuery({
    queryKey: FOLLOW_UPS_KEY,
    queryFn: getFollowUps,
    staleTime: 60_000,
  });
}

export function useSaveIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ incident, files }: { incident: Incident; files: File[] }) => {
      let imageUrls: string[] = [];
      if (files.length > 0) {
        toast.loading("Enviando imagens...", { id: "upload" });
        imageUrls = await uploadIncidentImages(files, incident.id);
        toast.dismiss("upload");
      }
      const finalIncident = { ...incident, imageUrls };
      await saveIncident(finalIncident);
      return finalIncident;
    },
    onSuccess: (incident) => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_KEY });
      queryClient.invalidateQueries({ queryKey: FOLLOW_UPS_KEY });
      if (incident.urgency === "Alta") {
        toast.error(`🚨 URGÊNCIA ALTA — ${incident.teacherName}: ${incident.description}`, { duration: 8000 });
      }
      if (incident.needsFollowUp) {
        toast.info(`📋 Acompanhamento criado para ${incident.teacherName}`, { duration: 4000 });
      }
      toast.success("Incidente registrado com sucesso", { duration: 2000 });
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ incident, newFiles }: { incident: Incident; newFiles?: File[] }) => {
      let newImageUrls: string[] = [];
      if (newFiles && newFiles.length > 0) {
        toast.loading("Enviando imagens...", { id: "upload-edit" });
        newImageUrls = await uploadIncidentImages(newFiles, incident.id);
        toast.dismiss("upload-edit");
      }
      const finalIncident = newFiles
        ? { ...incident, imageUrls: [...incident.imageUrls, ...newImageUrls] }
        : incident;
      await updateIncident(finalIncident);
      return finalIncident;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_KEY });
      queryClient.invalidateQueries({ queryKey: FOLLOW_UPS_KEY });
      toast.success("Incidente atualizado com sucesso", { duration: 2000 });
    },
  });
}

export function useDeleteIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, imageUrls }: { id: string; imageUrls?: string[] }) => {
      if (imageUrls?.length) {
        await deleteIncidentImages(imageUrls);
      }
      await deleteIncident(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_KEY });
      queryClient.invalidateQueries({ queryKey: FOLLOW_UPS_KEY });
      toast.success("Incidente excluído", { duration: 2000 });
    },
  });
}

export function useToggleResolved() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (incident: Incident) => {
      const nowResolved = !incident.resolved;
      await updateIncident({
        ...incident,
        resolved: nowResolved,
        resolvedAt: nowResolved ? new Date() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INCIDENTS_KEY });
    },
  });
}
