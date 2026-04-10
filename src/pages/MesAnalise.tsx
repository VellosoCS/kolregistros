import { useState, useCallback, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { Incident } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { useIncidents, useUpdateIncident } from "@/hooks/use-incidents";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Clock, CheckCircle, AlertTriangle, Search, Filter } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type StatusFilter = "todos" | "pendente" | "resolvido" | "vencido";
type ActiveTab = "pendentes" | "concluidos";

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
  const { role } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [activeTab, setActiveTab] = useState<ActiveTab>("pendentes");
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolvingIncident, setResolvingIncident] = useState<Incident | null>(null);
  const [resolutionText, setResolutionText] = useState("");

  const refresh = useCallback(async () => {
    const all = await getIncidents();
    setIncidents(all.filter((i) => i.problemType === "Mês de análise"));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const pendingIncidents = useMemo(() => incidents.filter((i) => !i.resolved), [incidents]);
  const resolvedIncidents = useMemo(() => incidents.filter((i) => i.resolved), [incidents]);

  const currentList = activeTab === "pendentes" ? pendingIncidents : resolvedIncidents;

  const filtered = useMemo(() => {
    let list = currentList;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.coordinator.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.teacherName.toLowerCase().includes(q));
    }
    if (activeTab === "pendentes") {
      if (statusFilter === "pendente") list = list.filter((i) => daysSince(i.createdAt) < 30);
      if (statusFilter === "vencido") list = list.filter((i) => daysSince(i.createdAt) >= 30);
    }
    return list;
  }, [currentList, search, statusFilter, activeTab]);

  const stats = useMemo(() => {
    const total = incidents.length;
    const resolved = resolvedIncidents.length;
    const overdue = pendingIncidents.filter((i) => daysSince(i.createdAt) >= 30).length;
    const pending = pendingIncidents.length;
    return { total, resolved, overdue, pending };
  }, [incidents, pendingIncidents, resolvedIncidents]);

  const handleOpenResolve = (incident: Incident) => {
    setResolvingIncident(incident);
    setResolutionText(incident.solution || "");
    setResolveDialogOpen(true);
  };

  const handleConfirmResolve = useCallback(async () => {
    if (!resolvingIncident) return;
    if (!resolutionText.trim()) {
      toast.error("Escreva o resultado do mês de análise");
      return;
    }
    await updateIncident({
      ...resolvingIncident,
      resolved: true,
      resolvedAt: new Date(),
      solution: resolutionText.trim(),
    });
    setResolveDialogOpen(false);
    setResolvingIncident(null);
    setResolutionText("");
    await refresh();
    toast.success("Marcado como resolvido");
  }, [resolvingIncident, resolutionText, refresh]);

  const handleReopen = useCallback(async (incident: Incident) => {
    await updateIncident({
      ...incident,
      resolved: false,
      resolvedAt: null,
    });
    await refresh();
    toast.success("Marcado como pendente");
  }, [refresh]);

  const progressPercent = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  if (role !== "coordenacao") {
    return <Navigate to="/" replace />;
  }

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

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-muted rounded-md p-1 w-fit">
          <button
            onClick={() => { setActiveTab("pendentes"); setStatusFilter("todos"); }}
            className={`px-4 py-2 text-sm font-medium rounded-sm transition-all ${
              activeTab === "pendentes" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pendentes ({pendingIncidents.length})
          </button>
          <button
            onClick={() => { setActiveTab("concluidos"); setStatusFilter("todos"); }}
            className={`px-4 py-2 text-sm font-medium rounded-sm transition-all ${
              activeTab === "concluidos" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Concluídos ({resolvedIncidents.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por professor, responsável ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-input text-sm text-foreground rounded-md focus:ring-2 ring-ring outline-none placeholder:text-muted-foreground"
            />
          </div>
          {activeTab === "pendentes" && (
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {(["todos", "pendente", "vencido"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
                >
                  {s === "todos" ? "Todos" : s === "pendente" ? "No prazo" : "Vencidos"}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <TooltipProvider>
          <div className="bg-card rounded-lg shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Professor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Responsável</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Descrição</th>
                  {activeTab === "concluidos" && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Resultado</th>
                  )}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Data</th>
                  {activeTab === "pendentes" && (
                    <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Dias</th>
                  )}
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === "concluidos" ? 7 : 7} className="px-4 py-8 text-center text-muted-foreground">
                      {activeTab === "pendentes" ? 'Nenhum incidente pendente.' : 'Nenhum incidente concluído.'}
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
                        <td className="px-4 py-3 font-medium text-foreground">{incident.teacherName}</td>
                        <td className="px-4 py-3 text-foreground">{incident.coordinator}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[250px] truncate" title={incident.description}>
                          {incident.description}
                        </td>
                        {activeTab === "concluidos" && (
                          <td className="px-4 py-3 text-foreground max-w-[250px]">
                            <span className="line-clamp-2" title={incident.solution}>{incident.solution || "—"}</span>
                          </td>
                        )}
                        <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                          {format(incident.createdAt, "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        {activeTab === "pendentes" && (
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
                            <div className="mx-auto mt-1 w-8 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${days >= 30 ? "bg-destructive" : days >= 20 ? "bg-amber-500" : "bg-primary"}`}
                                style={{ width: `${Math.min(100, (days / 30) * 100)}%` }}
                              />
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          {incident.resolved ? (
                            <button
                              onClick={() => handleReopen(incident)}
                              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300"
                            >
                              Reabrir
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenResolve(incident)}
                              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300"
                            >
                              Resolver
                            </button>
                          )}
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

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Resultado do Mês de Análise</DialogTitle>
          </DialogHeader>
          {resolvingIncident && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong className="text-foreground">Professor:</strong> {resolvingIncident.teacherName}</p>
                <p><strong className="text-foreground">Responsável:</strong> {resolvingIncident.coordinator}</p>
                <p><strong className="text-foreground">Descrição:</strong> {resolvingIncident.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Resultado / Conclusão <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Descreva o resultado do mês de análise..."
                  rows={4}
                  className="w-full px-3 py-2 bg-input text-sm text-foreground rounded-md border border-border focus:ring-2 ring-ring outline-none placeholder:text-muted-foreground resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setResolveDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmResolve}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Confirmar Resolução
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
