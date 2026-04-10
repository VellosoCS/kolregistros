import { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from "react";
import { Incident } from "@/lib/types";
import { useIncidents, useFollowUps, useSaveIncident, useDeleteIncident, useUpdateIncident, useToggleResolved, useIncidentsRealtime } from "@/hooks/use-incidents";
import IncidentForm from "@/components/IncidentForm";
import IncidentList, { IncidentListHandle } from "@/components/IncidentList";
import StatsCards from "@/components/StatsCards";
import IndexHeader from "@/components/IndexHeader";
import IncidentTabs from "@/components/IncidentTabs";
import { Skeleton } from "@/components/ui/skeleton";

const FrequencyChart = lazy(() => import("@/components/FrequencyChart"));
const TimelineChart = lazy(() => import("@/components/TimelineChart"));
import { toast } from "sonner";
import GoogleSheetsDialog from "@/components/GoogleSheetsDialog";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { role, displayName, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });
  const [periodFilteredIncidents, setPeriodFilteredIncidents] = useState<Incident[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "resolved" | "interno" | "resolvedCI">("active");
  const [sheetsDialogOpen, setSheetsDialogOpen] = useState(false);
  const [newResolvedCount, setNewResolvedCount] = useState(0);
  const [newResolvedCICount, setNewResolvedCICount] = useState(0);
  const prevResolvedLen = useRef<number | null>(null);
  const prevResolvedCILen = useRef<number | null>(null);
  const listRef = useRef<IncidentListHandle>(null);

  const { data: incidents = [] } = useIncidents();
  const { data: followUps = [] } = useFollowUps();
  useIncidentsRealtime();
  const saveIncidentMutation = useSaveIncident();
  const deleteIncidentMutation = useDeleteIncident();
  const updateIncidentMutation = useUpdateIncident();
  const toggleResolvedMutation = useToggleResolved();

  const canSeeMesAnalise = role === "coordenacao";
  const canSeeInterno = role === "coordenacao" || role === "suporte";
  const canSeeProfessor = role === "coordenacao" || role === "suporte";
  const allowedMode = role === "suporte_aluno" ? "professor" : null;

  const professorIncidents = useMemo(() => incidents.filter((i) => (i.incidentMode || "professor") === "professor"), [incidents]);
  const internoIncidents = useMemo(() => incidents.filter((i) => i.incidentMode === "interno"), [incidents]);
  const activeIncidents = useMemo(() => professorIncidents.filter((i) => !i.resolved), [professorIncidents]);
  const resolvedIncidents = useMemo(() => professorIncidents.filter((i) => i.resolved), [professorIncidents]);
  const activeInternoIncidents = useMemo(() => internoIncidents.filter((i) => !i.resolved), [internoIncidents]);
  const resolvedInternoIncidents = useMemo(() => internoIncidents.filter((i) => i.resolved), [internoIncidents]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Track new resolved incidents for badge
  useEffect(() => {
    const len = resolvedIncidents.length;
    if (prevResolvedLen.current !== null && len > prevResolvedLen.current && activeTab !== "resolved") {
      setNewResolvedCount(prev => prev + (len - prevResolvedLen.current!));
    }
    prevResolvedLen.current = len;
  }, [resolvedIncidents.length, activeTab]);

  useEffect(() => {
    const len = resolvedInternoIncidents.length;
    if (prevResolvedCILen.current !== null && len > prevResolvedCILen.current && activeTab !== "resolvedCI") {
      setNewResolvedCICount(prev => prev + (len - prevResolvedCILen.current!));
    }
    prevResolvedCILen.current = len;
  }, [resolvedInternoIncidents.length, activeTab]);

  // Daily follow-up notification (once per day)
  useEffect(() => {
    if (followUps.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const lastShown = localStorage.getItem("followup-toast-date");
      if (lastShown === today) return;
      localStorage.setItem("followup-toast-date", today);
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
  }, [followUps]);

  // 30-day reminder for "Mês de análise" incidents
  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const overdue = incidents.filter(
      (i) => i.problemType === "Mês de análise" && !i.resolved && i.createdAt <= thirtyDaysAgo
    );
    if (overdue.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const lastShown = localStorage.getItem("mes-analise-toast-date");
      if (lastShown === today) return;
      localStorage.setItem("mes-analise-toast-date", today);
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

  const handleSubmit = useCallback((incident: Incident, files: File[]) => {
    saveIncidentMutation.mutate({ incident, files });
  }, [saveIncidentMutation]);

  const handleDelete = useCallback((id: string) => {
    const incident = incidents.find((i) => i.id === id);
    deleteIncidentMutation.mutate({ id, imageUrls: incident?.imageUrls });
  }, [incidents, deleteIncidentMutation]);

  const handleEdit = useCallback((updated: Incident, newFiles: File[]) => {
    updateIncidentMutation.mutate({ incident: updated, newFiles });
  }, [updateIncidentMutation]);

  const handleToggleResolved = useCallback((id: string) => {
    const incident = incidents.find((i) => i.id === id);
    if (incident) {
      toggleResolvedMutation.mutate(incident);
    }
  }, [incidents, toggleResolvedMutation]);

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
      <IndexHeader
        displayName={displayName}
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
        canSeeMesAnalise={canSeeMesAnalise}
        onSignOut={signOut}
      />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          <aside>
            <IncidentForm onSubmit={handleSubmit} onModeChange={(mode) => setActiveTab(mode === "interno" ? "interno" : "active")} forcedMode={allowedMode} />
          </aside>

          <main className="space-y-6 min-w-0">
            <StatsCards incidents={activeTab === "interno" || activeTab === "resolvedCI" ? internoIncidents : professorIncidents} activeTab={activeTab} onPeriodFilterChange={setPeriodFilteredIncidents} />
            <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
              <FrequencyChart incidents={periodFilteredIncidents} useInternalTypes={activeTab === "interno"} />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-48 w-full rounded-lg" />}>
              <TimelineChart incidents={periodFilteredIncidents} />
            </Suspense>
            <div>
              <IncidentTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                activeCount={activeIncidents.length}
                resolvedCount={resolvedIncidents.length}
                internoCount={activeInternoIncidents.length}
                resolvedCICount={resolvedInternoIncidents.length}
                newResolvedCount={newResolvedCount}
                newResolvedCICount={newResolvedCICount}
                canSeeInterno={canSeeInterno}
                canSeeProfessor={canSeeProfessor}
                onClearResolvedBadge={() => setNewResolvedCount(0)}
                onClearResolvedCIBadge={() => setNewResolvedCICount(0)}
                onExportExcel={handleExportExcel}
                onOpenSheets={() => setSheetsDialogOpen(true)}
              />
              {activeTab === "active" ? (
                <IncidentList ref={listRef} incidentMode="professor" resolvedFilter={false} onDelete={handleDelete} onEdit={handleEdit} onToggleResolved={handleToggleResolved} />
              ) : activeTab === "resolved" ? (
                <IncidentList incidentMode="professor" resolvedFilter={true} onDelete={handleDelete} onEdit={handleEdit} onToggleResolved={handleToggleResolved} />
              ) : activeTab === "interno" ? (
                <IncidentList incidentMode="interno" resolvedFilter={false} onDelete={handleDelete} onEdit={handleEdit} onToggleResolved={handleToggleResolved} />
              ) : (
                <IncidentList incidentMode="interno" resolvedFilter={true} onDelete={handleDelete} onEdit={handleEdit} onToggleResolved={handleToggleResolved} />
              )}
            </div>
          </main>
        </div>
      </div>
      <GoogleSheetsDialog open={sheetsDialogOpen} onOpenChange={setSheetsDialogOpen} />
    </div>
  );
}
