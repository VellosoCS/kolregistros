import { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { Incident, PROBLEM_TYPES, ProblemType } from "@/lib/types";
import { useIncidentsByDateRange } from "@/hooks/use-incidents";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, ArrowLeft, CalendarDays, CalendarRange } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { generateReportPDF } from "@/lib/report-pdf";
const MetricsDashboard = lazy(() => import("@/components/MetricsDashboard"));
import { ALL_PROBLEM_ICONS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

type Period = "week" | "month";

export default function Reports() {
  const [period, setPeriod] = useState<Period>("week");
  const [offset, setOffset] = useState(0);

  const dateRange = useMemo(() => {
    const now = new Date();
    if (period === "week") {
      const ref = subWeeks(now, offset);
      return { start: startOfWeek(ref, { weekStartsOn: 1 }), end: endOfWeek(ref, { weekStartsOn: 1 }) };
    }
    const ref = subMonths(now, offset);
    return { start: startOfMonth(ref), end: endOfMonth(ref) };
  }, [period, offset]);

  // Server-side date range filtering
  const { data: filtered = [], isLoading } = useIncidentsByDateRange({
    startDate: dateRange.start.toISOString(),
    endDate: dateRange.end.toISOString(),
  });

  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    PROBLEM_TYPES.forEach((t) => (map[t] = 0));
    filtered.forEach((i) => (map[i.problemType] = (map[i.problemType] || 0) + 1));
    return Object.entries(map)
      .map(([type, count]) => ({ type: type as ProblemType, count }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const urgencyCounts = useMemo(() => {
    const alta = filtered.filter((i) => i.urgency === "Alta").length;
    const media = filtered.filter((i) => i.urgency === "Média").length;
    const baixa = filtered.filter((i) => i.urgency === "Baixa").length;
    return { alta, media, baixa };
  }, [filtered]);

  const resolvedCount = filtered.filter((i) => i.resolved).length;
  const pendingCount = filtered.filter((i) => !i.resolved).length;
  const followUpCount = filtered.filter((i) => i.needsFollowUp && !i.resolved).length;
  const maxCount = Math.max(...typeCounts.map((c) => c.count), 1);

  const rangeLabel = useMemo(() => {
    const s = format(dateRange.start, "dd/MM/yyyy", { locale: ptBR });
    const e = format(dateRange.end, "dd/MM/yyyy", { locale: ptBR });
    return `${s} — ${e}`;
  }, [dateRange]);

  const handleExportPDF = useCallback(() => {
    if (filtered.length === 0) {
      toast.error("Nenhum registro no período selecionado");
      return;
    }
    generateReportPDF(filtered, typeCounts, urgencyCounts, dateRange, period);
    toast.success("Relatório PDF exportado");
  }, [filtered, typeCounts, urgencyCounts, dateRange, period]);

  const handleExportDOCX = useCallback(async () => {
    if (filtered.length === 0) {
      toast.error("Nenhum registro no período selecionado");
      return;
    }
    const { generateReportDOCX } = await import("@/lib/report-docx");
    generateReportDOCX(filtered, typeCounts, urgencyCounts, dateRange, period);
    toast.success("Relatório Word exportado");
  }, [filtered, typeCounts, urgencyCounts, dateRange, period]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-heading text-foreground">Relatórios</h1>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={handleExportDOCX}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Word
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Period selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <button
              onClick={() => { setPeriod("week"); setOffset(0); }}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                period === "week" ? "bg-background text-foreground shadow-sm" : ""
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Semanal
            </button>
            <button
              onClick={() => { setPeriod("month"); setOffset(0); }}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                period === "month" ? "bg-background text-foreground shadow-sm" : ""
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Mensal
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset((o) => o + 1)}
              className="px-2 py-1 text-xs font-medium rounded bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              ← Anterior
            </button>
            <span className="text-sm font-medium text-foreground tabular-nums">{rangeLabel}</span>
            <button
              onClick={() => setOffset((o) => Math.max(0, o - 1))}
              disabled={offset === 0}
              className="px-2 py-1 text-xs font-medium rounded bg-secondary text-secondary-foreground hover:bg-accent transition-colors disabled:opacity-40"
            >
              Próximo →
            </button>
          </div>
        </div>


        {isLoading ? (
          <ReportsSkeleton />
        ) : (
          <>
            {/* Metrics Dashboard */}
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
              <MetricsDashboard incidents={filtered} />
            </Suspense>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard label="Total" value={filtered.length} />
          <SummaryCard label="Resolvidos" value={resolvedCount} color="text-urgency-low" />
          <SummaryCard label="Pendentes" value={pendingCount} color="text-urgency-medium" />
          <SummaryCard label="Acompanhamento" value={followUpCount} color="text-urgency-high" />
        </div>

        {/* Urgency breakdown */}
        <div className="bg-card rounded-lg shadow-[var(--card-shadow)] p-4">
          <h3 className="label-text mb-3">Distribuição por Urgência</h3>
          <div className="flex gap-4">
            <UrgencyBar label="Alta" count={urgencyCounts.alta} total={filtered.length} className="bg-urgency-high" />
            <UrgencyBar label="Média" count={urgencyCounts.media} total={filtered.length} className="bg-urgency-medium" />
            <UrgencyBar label="Baixa" count={urgencyCounts.baixa} total={filtered.length} className="bg-urgency-low" />
          </div>
        </div>

        {/* Problem type ranking */}
        <div className="bg-card rounded-lg shadow-[var(--card-shadow)] p-4">
          <h3 className="label-text mb-3">Tipos mais recorrentes</h3>
          <div className="space-y-2">
            {typeCounts.map(({ type, count }, idx) => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5 text-right">{idx + 1}.</span>
                <span className="text-muted-foreground">{ALL_PROBLEM_ICONS[type]}</span>
                <span className="text-xs text-foreground font-medium w-36 shrink-0 truncate" title={type}>{type}</span>
                <div className="flex-1 h-6 bg-secondary rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-sm transition-all duration-500"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums w-8 text-right">{count}</span>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {filtered.length > 0 ? `${Math.round((count / filtered.length) * 100)}%` : "0%"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed incidents list */}
        <div className="bg-card rounded-lg shadow-[var(--card-shadow)] p-4">
          <h3 className="label-text mb-3">Detalhes dos Incidentes ({filtered.length})</h3>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum registro neste período.</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filtered.map((inc) => (
                <div
                  key={inc.id}
                  className={`rounded-md border p-3 text-sm space-y-1 ${
                    inc.resolved
                      ? "bg-urgency-low/10 border-urgency-low/30"
                      : "bg-urgency-medium/10 border-urgency-medium/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{ALL_PROBLEM_ICONS[inc.problemType]}</span>
                      <span className="font-semibold text-foreground">{inc.problemType}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        inc.urgency === "Alta" ? "bg-urgency-high/10 text-urgency-high"
                          : inc.urgency === "Média" ? "bg-urgency-medium/10 text-urgency-medium"
                          : "bg-urgency-low/10 text-urgency-low"
                      }`}>{inc.urgency}</span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {format(new Date(inc.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-foreground"><strong>Professor:</strong> {inc.teacherName}</p>
                  {inc.coordinator && <p className="text-foreground"><strong>Responsável:</strong> {inc.coordinator}</p>}
                  <p className="text-foreground"><strong>Descrição:</strong> {inc.description}</p>
                  {inc.solution && <p className="text-foreground"><strong>Solução:</strong> {inc.solution}</p>}
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{inc.resolved ? "✅ Resolvido" : "⏳ Pendente"}</span>
                    {inc.needsFollowUp && <span>📋 Acompanhamento</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-card rounded-lg shadow-[var(--card-shadow)] p-4 text-center">
      <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color || "text-foreground"}`}>{value}</p>
    </div>
  );
}

function UrgencyBar({ label, count, total, className }: { label: string; count: number; total: number; className: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex-1 space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="text-foreground font-semibold tabular-nums">{count} ({pct}%)</span>
      </div>
      <div className="h-3 bg-secondary rounded-sm overflow-hidden">
        <div className={`h-full rounded-sm transition-all duration-500 ${className}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <>
      {/* Metrics skeleton */}
      <div className="bg-card rounded-lg shadow-[var(--card-shadow)] p-4 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg shadow-[var(--card-shadow)] p-4 text-center space-y-2">
            <Skeleton className="h-4 w-16 mx-auto" />
            <Skeleton className="h-8 w-12 mx-auto" />
          </div>
        ))}
      </div>
      {/* Urgency skeleton */}
      <div className="bg-card rounded-lg shadow-[var(--card-shadow)] p-4 space-y-3">
        <Skeleton className="h-4 w-44" />
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-1 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
      {/* Type ranking skeleton */}
      <div className="bg-card rounded-lg shadow-[var(--card-shadow)] p-4 space-y-3">
        <Skeleton className="h-4 w-48" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-5" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-6 flex-1" />
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
    </>
  );
}
