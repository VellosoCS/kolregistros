import { Incident, PROBLEM_TYPES, INTERNAL_PROBLEM_TYPES } from "@/lib/types";

interface FrequencyChartProps {
  incidents: Incident[];
  useInternalTypes?: boolean;
}

export default function FrequencyChart({ incidents, useInternalTypes }: FrequencyChartProps) {
  const types = useInternalTypes
    ? (INTERNAL_PROBLEM_TYPES.length > 0
        ? INTERNAL_PROBLEM_TYPES
        : [...new Set(incidents.map((i) => i.problemType))])
    : PROBLEM_TYPES;

  const counts = types.map((type) => ({
    type,
    count: incidents.filter((i) => i.problemType === type).length,
  })).sort((a, b) => b.count - a.count);

  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="bg-card rounded-lg shadow-card p-4">
      <h3 className="label-text mb-3">Problemas mais frequentes</h3>
      <div className="space-y-2">
        {counts.map(({ type, count }) => (
          <div key={type} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-32 shrink-0 text-right truncate" title={type}>{type}</span>
            <div className="flex-1 h-5 bg-secondary rounded-sm overflow-hidden">
              <div
                className="h-full bg-primary/80 rounded-sm transition-all duration-500"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-foreground tabular-nums w-6 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
