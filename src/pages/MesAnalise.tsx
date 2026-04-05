import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Incident } from "@/lib/types";
import { getIncidents, updateIncident } from "@/lib/incidents-store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, Search, Filter } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

type StatusFilter = "todos" | "pendente" | "resolvido" | "vencido";

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatus(incident: Incident): { label: string; color: string; overdue: boolean } {
  if (incident.resolved) {
    return { label: "Resolvido", color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300", overdue: false };
  }
  const days = daysSince(incident.createdAt);
  if (days >= 30) {
    return { label: `Vencido (${days}d)`, color: "bg-destructive/15 text-destructive", overdue: true };
  }
  return { label: `${30 - days}d restantes`, color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", overdue: false };
}

export default function MesAnalise() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");

  const refresh = useCallback(async () => {
    const all = await getIncidents();
    setIncidents(all.filter((i) => i.problemType === "Mês de análise"));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    let list = incidents;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.coordinator.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    if (statusFilter === "pendente") list = list.filter((i) => !i.resolved && daysSince(i.createdAt) < 30);
    if (statusFilter === "resolvido") list = list.filter((i) => i.resolved);
    if (statusFilter === "vencido") list = list.filter((i) => !i.resolved && daysSince(i.createdAt) >= 30);
    return list;
  }, [incidents, search, statusFilter]);

  const stats = useMemo(() => {
    const total = incidents.length;
    const resolved = incidents.filter((i) => i.resolved).length;
    const overdue = incidents.filter((i) => !i.resolved && daysSince(i.createdAt) >= 30).length;
    const pending = total - resolved;
    return { total, resolved, overdue, pending };
  }, [incidents]);

  const handleToggleResolved = useCallback(async (incident: Incident) => {
    const nowResolved = !incident.resolved;
    await updateIncident({
      ...incident,
      resolved: nowResolved,
      resolvedAt: nowResolved ? new Date() : null,
    });
    await refresh();
    toast.success(nowResolved ? "Marcado como resolvido" : "Marcado como pendente");
  }, [refresh]);

  const progressPercent = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <h1 className="text-heading text-foreground">Mês de Análise</h1>
          <span className="text-xs text-muted-foreground ml-1">Acompanhamento de 30 dias</span>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card rounded-lg shadow-card p-4">
            <p className="label-text text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="bg-card rounded-lg shadow-card p-4">
            <p className="label-text text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Pendentes</p>
            <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
          </div>
          <div className="bg-card rounded-lg shadow-card p-4">
            <p className="label-text text-destructive flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Vencidos (30d+)</p>
            <p className="text-2xl font-bold text-destructive">{stats.overdue}</p>
          </div>
          <div className="bg-card rounded-lg shadow-card p-4">
            <p className="label-text text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Resolvidos</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.resolved}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-card rounded-lg shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progresso de resolução</span>
            <span className="text-sm font-bold text-foreground">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por responsável ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-input text-sm text-foreground rounded-md focus:ring-2 ring-ring outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {(["todos", "pendente", "vencido", "resolvido"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {s === "todos" ? "Todos" : s === "pendente" ? "Pendentes" : s === "vencido" ? "Vencidos" : "Resolvidos"}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <TooltipProvider>
          <div className="bg-card rounded-lg shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Responsável</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Descrição</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Data</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Dias</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum incidente "Mês de análise" encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((incident) => {
                    const status = getStatus(incident);
                    const days = daysSince(incident.createdAt);
                    return (
                      <tr
                        key={incident.id}
                        className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors ${
                          status.overdue ? "bg-destructive/5" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                            {status.overdue && <AlertTriangle className="w-3 h-3" />}
                            {incident.resolved && <CheckCircle className="w-3 h-3" />}
                            {!incident.resolved && !status.overdue && <Clock className="w-3 h-3" />}
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{incident.coordinator}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[300px] truncate" title={incident.description}>
                          {incident.description}
                        </td>
                        <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                          {format(incident.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Tooltip>
                            <TooltipTrigger>
                              <span className={`font-bold text-sm ${days >= 30 ? "text-destructive" : days >= 20 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                                {days}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {days >= 30
                                ? `Vencido há ${days - 30} dia${days - 30 !== 1 ? "s" : ""}`
                                : `${30 - days} dia${30 - days !== 1 ? "s" : ""} restante${30 - days !== 1 ? "s" : ""}`}
                            </TooltipContent>
                          </Tooltip>
                          {/* Progress ring */}
                          <div className="mx-auto mt-1 w-8 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${days >= 30 ? "bg-destructive" : days >= 20 ? "bg-amber-500" : "bg-primary"}`}
                              style={{ width: `${Math.min(100, (days / 30) * 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleResolved(incident)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              incident.resolved
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300"
                                : "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300"
                            }`}
                          >
                            {incident.resolved ? "Reabrir" : "Resolver"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
