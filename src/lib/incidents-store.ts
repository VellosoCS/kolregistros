import { Incident, Coordinator, ProblemType, UrgencyLevel } from "./types";
import { supabase } from "@/integrations/supabase/client";

function rowToIncident(row: any): Incident {
  return {
    id: row.id,
    teacherName: row.teacher_name,
    coordinator: row.coordinator as Coordinator,
    problemType: row.problem_type as ProblemType,
    urgency: row.urgency as UrgencyLevel,
    description: row.description,
    solution: row.solution || "",
    needsFollowUp: row.needs_follow_up,
    resolved: row.resolved,
    imageUrls: row.image_urls || [],
    createdAt: new Date(row.created_at),
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
  };
}

export async function getIncidents(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching incidents:", error);
    return [];
  }
  return (data || []).map(rowToIncident);
}

export async function saveIncident(incident: Incident): Promise<void> {
  const { error } = await supabase.from("incidents").insert(incidentToRow(incident));
  if (error) console.error("Error saving incident:", error);
}

export async function updateIncident(updated: Incident): Promise<void> {
  const { error } = await supabase
    .from("incidents")
    .update(incidentToRow(updated))
    .eq("id", updated.id);
  if (error) console.error("Error updating incident:", error);
}

export async function deleteIncident(id: string): Promise<void> {
  const { error } = await supabase.from("incidents").delete().eq("id", id);
  if (error) console.error("Error deleting incident:", error);
}

export async function getFollowUps(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("needs_follow_up", true)
    .eq("resolved", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching follow-ups:", error);
    return [];
  }
  return (data || []).map(rowToIncident);
}
