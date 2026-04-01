import { useMemo } from "react";
import { Incident } from "@/lib/types";
import { Clock, CheckCircle, Users } from "lucide-react";

interface MetricsDashboardProps {
  incidents: Incident[];
}

// Levenshtein distance for fuzzy name matching
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

function normalizeTeacherNames(incidents: Incident[]): Map<string, string> {
  const names = [...new Set(incidents.map((i) => i.teacherName.trim()))];
  const canonical = new Map<string, string>();
  const groups: string[][] = [];

  for (const name of names) {
    const lower = name.toLowerCase();
    let found = false;
    for (const group of groups) {
      if (group.some((g) => similarity(g.toLowerCase(), lower) >= 0.8)) {
        group.push(name);
        found = true;
        break;
      }
    }
    if (!found) groups.push([name]);
  }

  for (const group of groups) {
    // Use the most frequent spelling as canonical
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

export default function MetricsDashboard({ incidents }: MetricsDashboardProps) {
  const resolvedIncidents = useMemo(
    () => incidents.filter((i) => i.resolved),
    [incidents]
  );

  const resolutionRate = useMemo(() => {
    if (incidents.length === 0) return 0;
    return Math.round((resolvedIncidents.length / incidents.length) * 100);
  }, [incidents, resolvedIncidents]);

  const avgResolutionTime = useMemo(() => {
    const withTime = resolvedIncidents.filter((i) => i.resolvedAt);
    if (withTime.length === 0) return null;
    const totalHours = withTime.reduce((sum, i) => {
      const diff = i.resolvedAt!.getTime() - i.createdAt.getTime();
      return sum + diff / (1000 * 60 * 60);
    }, 0);
    return totalHours / withTime.length;
  }, [resolvedIncidents]);

  const formatTime = (hours: number | null) => {
    if (hours === null) return "—";
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  const teacherRanking = useMemo(() => {
    const canonical = normalizeTeacherNames(incidents);
    const counts = new Map<string, number>();
    for (const inc of incidents) {
      const name = canonical.get(inc.teacherName.trim()) || inc.teacherName.trim();
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [incidents]);

  const maxTeacherCount = Math.max(...teacherRanking.map((t) => t.count), 1);

  return (
    <div className="space-y-4">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card rounded-lg shadow-[var(--card-shadow)] p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Tempo Médio de Resolução</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {formatTime(avgResolutionTime)}
          </p>
          {avgResolutionTime === null && (
            <p className="text-[10px] text-muted-foreground mt-1">Nenhum dado disponível</p>
          )}
        </div>

        <div className="bg-card rounded-lg shadow-[var(--card-shadow)] p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Taxa de Resolução</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{resolutionRate}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            {resolvedIncidents.length} de {incidents.length} resolvidos
          </p>
        </div>

        <div className="bg-card rounded-lg shadow-[var(--card-shadow)] p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Professores com Incidentes</span>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">{teacherRanking.length}</p>
        </div>
      </div>

      {/* Teacher ranking */}
      <div className="bg-card rounded-lg shadow-[var(--card-shadow)] p-4">
        <h3 className="label-text mb-3">Ranking de Professores com Mais Incidentes</h3>
        {teacherRanking.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível.</p>
        ) : (
          <div className="space-y-2">
            {teacherRanking.map(({ name, count }, idx) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5 text-right">{idx + 1}.</span>
                <span className="text-xs text-foreground font-medium w-32 shrink-0 truncate" title={name}>
                  {name}
                </span>
                <div className="flex-1 h-5 bg-secondary rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-sm transition-all duration-500"
                    style={{ width: `${(count / maxTeacherCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
