import { Incident } from "./types";

export const MES_ANALISE_TRIGGER_TYPES = [
  "No-Show",
  "Muitas pendências",
  "Muitas faltas",
  "Reclamação",
  "Profissionalismo",
  "Organização",
] as const;

export type MesAnaliseLevel = "critico" | "alerta" | "observacao";

export interface MesAnaliseSuggestion {
  canonicalName: string;
  variations: string[];
  totalCount: number;
  level: MesAnaliseLevel;
  byType: { type: string; count: number }[];
  lastIncidentAt: Date;
  incidents: Incident[];
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Builds a canonical-name map for teacher names using fuzzy similarity (Levenshtein).
 * Names within similarity >= threshold are grouped together; the canonical name is
 * the spelling that appears most frequently in the incidents list.
 */
export function buildTeacherNameCanonicalMap(
  incidents: Incident[],
  threshold = 0.8,
): Map<string, string> {
  const names = [...new Set(incidents.map((i) => i.teacherName.trim()).filter(Boolean))];
  const canonical = new Map<string, string>();
  const groups: string[][] = [];

  for (const name of names) {
    const lower = name.toLowerCase();
    let found = false;
    for (const group of groups) {
      if (group.some((g) => similarity(g.toLowerCase(), lower) >= threshold)) {
        group.push(name);
        found = true;
        break;
      }
    }
    if (!found) groups.push([name]);
  }

  for (const group of groups) {
    const freq = new Map<string, number>();
    for (const n of group) {
      const count = incidents.filter((i) => i.teacherName.trim() === n).length;
      freq.set(n, count);
    }
    const canon = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
    for (const n of group) canonical.set(n, canon);
  }

  return canonical;
}

function levelFor(count: number): MesAnaliseLevel | null {
  if (count >= 5) return "critico";
  if (count >= 3) return "alerta";
  if (count >= 2) return "observacao";
  return null;
}

export function computeMesAnaliseSuggestions(incidents: Incident[]): MesAnaliseSuggestion[] {
  const triggerSet = new Set<string>(MES_ANALISE_TRIGGER_TYPES);
  const negative = incidents.filter((i) => triggerSet.has(i.problemType));
  if (negative.length === 0) return [];

  const canonical = buildTeacherNameCanonicalMap(negative);

  const groups = new Map<string, Incident[]>();
  for (const inc of negative) {
    const key = canonical.get(inc.teacherName.trim()) || inc.teacherName.trim();
    if (!key) continue;
    const arr = groups.get(key) ?? [];
    arr.push(inc);
    groups.set(key, arr);
  }

  const suggestions: MesAnaliseSuggestion[] = [];
  for (const [name, list] of groups) {
    const level = levelFor(list.length);
    if (!level) continue;

    const variations = [...new Set(list.map((i) => i.teacherName.trim()))];
    const typeCounts = new Map<string, number>();
    for (const i of list) typeCounts.set(i.problemType, (typeCounts.get(i.problemType) ?? 0) + 1);
    const byType = [...typeCounts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
    const lastIncidentAt = list.reduce(
      (max, i) => (i.createdAt > max ? i.createdAt : max),
      list[0].createdAt,
    );

    suggestions.push({
      canonicalName: name,
      variations,
      totalCount: list.length,
      level,
      byType,
      lastIncidentAt,
      incidents: [...list].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    });
  }

  return suggestions.sort((a, b) => b.totalCount - a.totalCount);
}
