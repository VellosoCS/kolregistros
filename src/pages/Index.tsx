import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Incident } from "@/lib/types";
import { getIncidents, saveIncident, deleteIncident, updateIncident, getFollowUps } from "@/lib/incidents-store";
import { uploadIncidentImages, deleteIncidentImages } from "@/lib/image-upload";
import IncidentForm from "@/components/IncidentForm";
import IncidentList, { IncidentListHandle } from "@/components/IncidentList";
import StatsCards from "@/components/StatsCards";
import FrequencyChart from "@/components/FrequencyChart";
import TimelineChart from "@/components/TimelineChart";
import { toast } from "sonner";
import { Download, Moon, Sun, BarChart3, Sheet, AlertTriangle, LogOut } from "lucide-react";
import logoKing from "@/assets/logo-king.png";
import GoogleSheetsDialog from "@/components/GoogleSheetsDialog";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";


export default function Index() {
  const { role, displayName, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [periodFilteredIncidents, setPeriodFilteredIncidents] = useState<Incident[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "resolved" | "interno">("active");
  const [sheetsDialogOpen, setSheetsDialogOpen] = useState(false);
  const listRef = useRef<IncidentListHandle>(null);

  const canSeeMesAnalise = role === "coordenacao";
  const canSeeInterno = role === "coordenacao" || role === "suporte";
  const allowedMode = role === "suporte_aluno" ? "professor" : null;

  const professorIncidents = useMemo(() => incidents.filter((i) => (i.incidentMode || "professor") === "professor"), [incidents]);
  const internoIncidents = useMemo(() => incidents.filter((i) => i.incidentMode === "interno"), [incidents]);
  const activeIncidents = useMemo(() => professorIncidents.filter((i) => !i.resolved), [professorIncidents]);
  const resolvedIncidents = useMemo(() => professorIncidents.filter((i) => i.resolved), [professorIncidents]);

  const refreshIncidents = useCallback(async () => {
    const data = await getIncidents();
    setIncidents(data);
  }, []);

  useEffect(() => {
    refreshIncidents();
  }, [refreshIncidents]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Daily follow-up notification
  useEffect(() => {
    getFollowUps().then((followUps) => {
      if (followUps.length > 0) {
        toast.warning(
          `📋 Você tem ${followUps.length} incidente${followUps.length > 1 ? "s" : ""} pendente${followUps.length > 1 ? "s" : ""} de acompanhamento`,
          {
            closeButton: true,
            duration: 15000,
            description: followUps.slice(0, 3).map((i) => `• ${i.teacherName}: ${i.description.slice(0, 50)}`).join("\n") +
              (followUps.length > 3 ? `\n...e mais ${followUps.length - 3}` : ""),
            action: {
              label: "Ver pendentes",
              onClick: () => listRef.current?.showFollowUpPending(),
            },
          }
        );
      }
    });
  }, []);

  // 30-day reminder for "Mês de análise" incidents
  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const overdue = incidents.filter(
      (i) => i.problemType === "Mês de análise" && !i.resolved && i.createdAt <= thirtyDaysAgo
    );
    if (overdue.length > 0) {
      toast.error(
        `⏰ ${overdue.length} incidente${overdue.length > 1 ? "s" : ""} "Mês de análise" com mais de 30 dias`,
        {
          closeButton: true,
          duration: 20000,
          description: overdue.slice(0, 3).map((i) => {
            const days = Math.floor((Date.now() - i.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            return `• ${i.coordinator} — ${days} dias`;
          }).join("\n") + (overdue.length > 3 ? `\n...e mais ${overdue.length - 3}` : ""),
        }
      );
    }
  }, [incidents]);

  const handleSubmit = useCallback(async (incident: Incident, files: File[]) => {
    let imageUrls: string[] = [];

    if (files.length > 0) {
      toast.loading("Enviando imagens...", { id: "upload" });
      imageUrls = await uploadIncidentImages(files, incident.id);
      toast.dismiss("upload");
    }

    const finalIncident = { ...incident, imageUrls };
    await saveIncident(finalIncident);
    await refreshIncidents();

    if (finalIncident.urgency === "Alta") {
      toast.error(`🚨 URGÊNCIA ALTA — ${finalIncident.teacherName}: ${finalIncident.description}`, {
        duration: 8000,
      });
    }

    if (finalIncident.needsFollowUp) {
      toast.info(`📋 Acompanhamento criado para ${finalIncident.teacherName}`, {
        duration: 4000,
      });
    }

    toast.success("Incidente registrado com sucesso", { duration: 2000 });
  }, [refreshIncidents]);

  const handleDelete = useCallback(async (id: string) => {
    const incident = incidents.find((i) => i.id === id);
    if (incident?.imageUrls?.length) {
      await deleteIncidentImages(incident.imageUrls);
    }
    await deleteIncident(id);
    await refreshIncidents();
    toast.success("Incidente excluído", { duration: 2000 });
  }, [incidents, refreshIncidents]);

  const handleEdit = useCallback(async (updated: Incident, newFiles: File[]) => {
    let newImageUrls: string[] = [];
    if (newFiles.length > 0) {
      toast.loading("Enviando imagens...", { id: "upload-edit" });
      newImageUrls = await uploadIncidentImages(newFiles, updated.id);
      toast.dismiss("upload-edit");
    }

    const finalIncident = { ...updated, imageUrls: [...updated.imageUrls, ...newImageUrls] };
    await updateIncident(finalIncident);
    await refreshIncidents();
    toast.success("Incidente atualizado com sucesso", { duration: 2000 });
  }, [refreshIncidents]);

  const handleToggleResolved = useCallback(async (id: string) => {
    const incident = incidents.find((i) => i.id === id);
    if (incident) {
      const nowResolved = !incident.resolved;
      await updateIncident({
        ...incident,
        resolved: nowResolved,
        resolvedAt: nowResolved ? new Date() : null,
      });
      await refreshIncidents();
    }
  }, [incidents, refreshIncidents]);

  const handleExportExcel = useCallback(async () => {
    if (incidents.length === 0) {
      toast.error("Nenhum registro para exportar");
      return;
    }
    toast.loading("Preparando exportação...", { id: "export" });
    const XLSX = await import("xlsx");
    const data = incidents.map((i) => ({
      Urgência: i.urgency,
      Professor: i.teacherName,
      Responsável: i.coordinator,
      Tipo: i.problemType,
      Descrição: i.description,
      Solução: i.solution || "",
      Acompanhamento: i.needsFollowUp ? "Sim" : "Não",
      Resolvido: i.resolved ? "Sim" : "Não",
      Data: new Date(i.createdAt).toLocaleString("pt-BR"),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Incidentes");
    XLSX.writeFile(wb, "incidentes.xlsx");
    toast.dismiss("export");
    toast.success("Planilha exportada com sucesso");
  }, [incidents]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
           <img src={logoKing} alt="KoL" className="h-16 w-auto" />
          <h1 className="text-heading text-foreground text-lg">NEXUS</h1>
          <div className="ml-auto flex items-center gap-3">
            {canSeeMesAnalise && (
              <Link
                to="/mes-analise"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Mês de Análise
              </Link>
            )}
            <Link
              to="/relatorios"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Relatórios
            </Link>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-muted-foreground" />
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              <Moon className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground border-l border-border pl-3">
              {displayName}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:bg-accent transition-colors"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          {/* Left: Form */}
          <aside className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:scrollbar-thin">
            <IncidentForm onSubmit={handleSubmit} onModeChange={(mode) => setActiveTab(mode === "interno" ? "interno" : "active")} forcedMode={allowedMode} />
          </aside>

          {/* Right: Data */}
          <main className="space-y-6 min-w-0">
            <StatsCards incidents={activeTab === "interno" ? internoIncidents : professorIncidents} activeTab={activeTab} onPeriodFilterChange={setPeriodFilteredIncidents} />
            <FrequencyChart incidents={periodFilteredIncidents} useInternalTypes={activeTab === "interno"} />
            <TimelineChart incidents={periodFilteredIncidents} />
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                  {(role === "coordenacao" || role === "suporte") && (
                    <>
                      <button
                        onClick={() => setActiveTab("active")}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                          activeTab === "active" ? "bg-background text-foreground shadow-sm" : ""
                        }`}
                      >
                        Registros Recentes ({activeIncidents.length})
                      </button>
                      <button
                        onClick={() => setActiveTab("resolved")}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                          activeTab === "resolved" ? "bg-background text-foreground shadow-sm" : ""
                        }`}
                      >
                        Solucionados ({resolvedIncidents.length})
                      </button>
                    </>
                  )}
                  {role === "coordenacao" && (
                    <button
                      onClick={() => setActiveTab("interno")}
                      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all ${
                        activeTab === "interno" ? "bg-background text-foreground shadow-sm" : ""
                      }`}
                    >
                      Controle Interno ({internoIncidents.length})
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSheetsDialogOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
                  >
                    <Sheet className="w-3.5 h-3.5" />
                    Google Sheets
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar Excel
                  </button>
                </div>
              </div>
              {activeTab === "active" ? (
                <IncidentList ref={listRef} incidents={activeIncidents} onDelete={handleDelete} onEdit={handleEdit} onToggleResolved={handleToggleResolved} />
              ) : activeTab === "resolved" ? (
                <IncidentList incidents={resolvedIncidents} onDelete={handleDelete} onEdit={handleEdit} onToggleResolved={handleToggleResolved} />
              ) : (
                <IncidentList incidents={internoIncidents} onDelete={handleDelete} onEdit={handleEdit} onToggleResolved={handleToggleResolved} />
              )}
            </div>
          </main>
        </div>
      </div>
      <GoogleSheetsDialog open={sheetsDialogOpen} onOpenChange={setSheetsDialogOpen} />
    </div>
  );
}
