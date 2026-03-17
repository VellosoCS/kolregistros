import { Incident } from "./types";

const STORAGE_KEY = "support-pulse-incidents";

export function getIncidents(): Incident[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((i: any) => ({ ...i, createdAt: new Date(i.createdAt) }));
  } catch {
    return [];
  }
}

export function saveIncident(incident: Incident): void {
  const existing = getIncidents();
  existing.unshift(incident);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getFollowUps(): Incident[] {
  return getIncidents().filter((i) => i.needsFollowUp);
}
