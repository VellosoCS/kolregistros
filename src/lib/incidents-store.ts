import { Incident, ProblemType, UrgencyLevel, IncidentMode } from "./types";
import { supabase } from "@/integrations/supabase/client";

function rowToIncident(row: any): Incident {
  return {
    id: row.id,
    teacherName: row.teacher_name,
    coordinator: row.coordinator,
    problemType: row.problem_type as ProblemType,
    urgency: row.urgency as UrgencyLevel,
    description: row.description,
    solution: row.solution || "",
    needsFollowUp: row.needs_follow_up,
    resolved: row.resolved,
    imageUrls: row.image_urls || [],
    createdAt: new Date(row.created_at),
    resolvedAt: row.resolved_at ? new Date(row.resolved_at) : null,
    incidentMode: (row.incident_mode as IncidentMode) || "professor",
  };
}

function incidentToRow(i: Incident) {
  return {
    id: i.id,
    teacher_name: i.teacherName,
    coordinator: i.coordinator,
    problem_type: i.problemType,
    urgency: i.urgency,
    description: i.description,
    solution: i.solution,
    needs_follow_up: i.needsFollowUp,
    resolved: i.resolved,
    image_urls: i.imageUrls,
    created_at: i.createdAt.toISOString(),
    resolved_at: i.resolvedAt ? i.resolvedAt.toISOString() : null,
    incident_mode: i.incidentMode || "professor",
  };
}

export async function getIncidents(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar incidentes: ${error.message}`);
  }
  return (data || []).map(rowToIncident);
}

export interface PaginatedResult {
  data: Incident[];
  count: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  incidentMode?: "professor" | "interno";
  resolved?: boolean;
  search?: string;
  problemType?: string;
  urgency?: string;
  coordinator?: string;
  needsFollowUp?: boolean;
}

export async function getIncidentsPaginated(params: PaginationParams): Promise<PaginatedResult> {
  const { page, pageSize, incidentMode, resolved, search, problemType, urgency, coordinator, needsFollowUp } = params;

  let query = supabase
    .from("incidents")
    .select("*", { count: "exact" });

  if (incidentMode) {
    query = query.eq("incident_mode", incidentMode);
  }
  if (resolved !== undefined) {
    query = query.eq("resolved", resolved);
  }
  if (problemType && problemType !== "Todos") {
    query = query.eq("problem_type", problemType);
  }
  if (urgency && urgency !== "Todas") {
    query = query.eq("urgency", urgency);
  }
  if (coordinator && coordinator.trim()) {
    query = query.ilike("coordinator", `%${coordinator.trim()}%`);
  }
  if (needsFollowUp) {
    query = query.eq("needs_follow_up", true);
    query = query.eq("resolved", false);
  }
  if (search && search.trim()) {
    const q = search.trim();
    query = query.or(`teacher_name.ilike.%${q}%,description.ilike.%${q}%,solution.ilike.%${q}%`);
  }

  query = query.order("created_at", { ascending: false });

  if (pageSize > 0) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erro ao buscar incidentes: ${error.message}`);
  }

  return {
    data: (data || []).map(rowToIncident),
    count: count ?? 0,
  };
}

export async function saveIncident(incident: Incident): Promise<void> {
  const { error } = await supabase.from("incidents").insert(incidentToRow(incident));
  if (error) throw new Error(`Erro ao salvar incidente: ${error.message}`);
}

export async function updateIncident(updated: Incident): Promise<void> {
  const { error } = await supabase
    .from("incidents")
    .update(incidentToRow(updated))
    .eq("id", updated.id);
  if (error) throw new Error(`Erro ao atualizar incidente: ${error.message}`);
}

export async function deleteIncident(id: string): Promise<void> {
  const { error } = await supabase.from("incidents").delete().eq("id", id);
  if (error) throw new Error(`Erro ao excluir incidente: ${error.message}`);
}

export async function getFollowUps(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("needs_follow_up", true)
    .eq("resolved", false)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar acompanhamentos: ${error.message}`);
  }
  return (data || []).map(rowToIncident);
}
