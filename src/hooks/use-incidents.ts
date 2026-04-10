import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Incident } from "@/lib/types";
import {
  getIncidents, saveIncident, updateIncident, deleteIncident, getFollowUps,
  getIncidentsPaginated, PaginationParams,
  getIncidentsByDateRange, DateRangeParams,
  getMesAnaliseIncidents, MesAnaliseParams,
} from "@/lib/incidents-store";
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
          queryClient.invalidateQueries({ queryKey: ["incidents-paginated"] });
          queryClient.invalidateQueries({ queryKey: ["incidents-date-range"] });
          queryClient.invalidateQueries({ queryKey: ["mes-analise"] });
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
    meta: { errorMessage: "Falha ao carregar incidentes" },
  });
}

export function useIncidentsPaginated(params: PaginationParams) {
  return useQuery({
    queryKey: ["incidents-paginated", params],
    queryFn: () => getIncidentsPaginated(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    meta: { errorMessage: "Falha ao carregar incidentes" },
  });
}

/**
 * Server-side date-range filtered query for Reports page.
 */
export function useIncidentsByDateRange(params: DateRangeParams) {
  return useQuery({
    queryKey: ["incidents-date-range", params],
    queryFn: () => getIncidentsByDateRange(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    meta: { errorMessage: "Falha ao carregar incidentes do período" },
  });
}

/**
 * Server-side filtered query for MesAnalise page.
 */
export function useMesAnaliseIncidents(params?: MesAnaliseParams) {
  return useQuery({
    queryKey: ["mes-analise", params],
    queryFn: () => getMesAnaliseIncidents(params),
    staleTime: 30_000,
    meta: { errorMessage: "Falha ao carregar mês de análise" },
  });
}

export function useFollowUps() {
  return useQuery({
    queryKey: FOLLOW_UPS_KEY,
    queryFn: getFollowUps,
    staleTime: 60_000,
    meta: { errorMessage: "Falha ao carregar acompanhamentos" },
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
      queryClient.invalidateQueries({ queryKey: ["incidents-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["incidents-date-range"] });
      queryClient.invalidateQueries({ queryKey: ["mes-analise"] });
      if (incident.urgency === "Alta") {
        toast.error(`🚨 URGÊNCIA ALTA — ${incident.teacherName}: ${incident.description}`, { duration: 8000 });
      }
      if (incident.needsFollowUp) {
        toast.info(`📋 Acompanhamento criado para ${incident.teacherName}`, { duration: 4000 });
      }
      toast.success("Incidente registrado com sucesso", { duration: 2000 });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar incidente: ${error.message}`, { duration: 5000 });
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
      queryClient.invalidateQueries({ queryKey: ["incidents-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["incidents-date-range"] });
      queryClient.invalidateQueries({ queryKey: ["mes-analise"] });
      toast.success("Incidente atualizado com sucesso", { duration: 2000 });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar incidente: ${error.message}`, { duration: 5000 });
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
      queryClient.invalidateQueries({ queryKey: ["incidents-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["incidents-date-range"] });
      queryClient.invalidateQueries({ queryKey: ["mes-analise"] });
      toast.success("Incidente excluído", { duration: 2000 });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir incidente: ${error.message}`, { duration: 5000 });
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
      queryClient.invalidateQueries({ queryKey: ["incidents-paginated"] });
      queryClient.invalidateQueries({ queryKey: ["incidents-date-range"] });
      queryClient.invalidateQueries({ queryKey: ["mes-analise"] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao alterar status: ${error.message}`, { duration: 5000 });
    },
  });
}
