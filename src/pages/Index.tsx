import { useState, useCallback, useEffect, useRef } from "react";
import { Incident } from "@/lib/types";
import { getIncidents, saveIncident, deleteIncident, updateIncident } from "@/lib/incidents-store";
import { uploadIncidentImages, deleteIncidentImages } from "@/lib/image-upload";
import IncidentForm from "@/components/IncidentForm";
import IncidentList from "@/components/IncidentList";
import StatsCards from "@/components/StatsCards";
import FrequencyChart from "@/components/FrequencyChart";
import { toast } from "sonner";
import { Zap, Download, Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import * as XLSX from "xlsx";

export default function Index() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });
  const [incidents, setIncidents] = useState<Incident[]>(getIncidents);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Daily follow-up notification
  useEffect(() => {
    const today = new Date().toDateString();
    const lastNotified = localStorage.getItem("followup-notified-date");
    if (lastNotified === today) return;

    const followUps = getIncidents().filter((i) => i.needsFollowUp && !i.resolved);
    if (followUps.length > 0) {
      localStorage.setItem("followup-notified-date", today);
      toast.warning(
        `📋 Você tem ${followUps.length} incidente${followUps.length > 1 ? "s" : ""} pendente${followUps.length > 1 ? "s" : ""} de acompanhamento`,
        {
          duration: 10000,
          description: followUps.slice(0, 3).map((i) => `• ${i.teacherName}: ${i.description.slice(0, 50)}`).join("\n") +
            (followUps.length > 3 ? `\n...e mais ${followUps.length - 3}` : ""),
        }
      );
    }
  }, []);

  const handleSubmit = useCallback(async (incident: Incident, files: File[]) => {
    let imageUrls: string[] = [];

    if (files.length > 0) {
      toast.loading("Enviando imagens...", { id: "upload" });
      imageUrls = await uploadIncidentImages(files, incident.id);
      toast.dismiss("upload");
    }

    const finalIncident = { ...incident, imageUrls };
    saveIncident(finalIncident);
    setIncidents(getIncidents());

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
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const incident = getIncidents().find((i) => i.id === id);
    if (incident?.imageUrls?.length) {
      await deleteIncidentImages(incident.imageUrls);
    }
    deleteIncident(id);
    setIncidents(getIncidents());
    toast.success("Incidente excluído", { duration: 2000 });
  }, []);

  const handleEdit = useCallback(async (updated: Incident, newFiles: File[]) => {
    let newImageUrls: string[] = [];
    if (newFiles.length > 0) {
      toast.loading("Enviando imagens...", { id: "upload-edit" });
      newImageUrls = await uploadIncidentImages(newFiles, updated.id);
      toast.dismiss("upload-edit");
    }

    const finalIncident = { ...updated, imageUrls: [...updated.imageUrls, ...newImageUrls] };
    updateIncident(finalIncident);
    setIncidents(getIncidents());
    toast.success("Incidente atualizado com sucesso", { duration: 2000 });
  }, []);

  const handleToggleResolved = useCallback((id: string) => {
    const incident = getIncidents().find((i) => i.id === id);
    if (incident) {
      updateIncident({ ...incident, resolved: !incident.resolved });
      setIncidents(getIncidents());
    }
  }, []);

  const handleExportExcel = useCallback(() => {
    if (incidents.length === 0) {
      toast.error("Nenhum registro para exportar");
      return;
    }
    const data = incidents.map((i) => ({
      Urgência: i.urgency,
      Professor: i.teacherName,
      Coordenador: i.coordinator,
      Tipo: i.problemType,
      Descrição: i.description,
      Solução: i.solution || "",
      Acompanhamento: i.needsFollowUp ? "Sim" : "Não",
      Data: new Date(i.createdAt).toLocaleString("pt-BR"),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Incidentes");
    XLSX.writeFile(wb, "incidentes.xlsx");
    toast.success("Planilha exportada com sucesso");
  }, [incidents]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h1 className="text-heading text-foreground">KoL - Registro de Incidentes</h1>
          <div className="ml-auto flex items-center gap-2">
            <Sun className="w-4 h-4 text-muted-foreground" />
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            <Moon className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          {/* Left: Form */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <IncidentForm onSubmit={handleSubmit} />
          </aside>

          {/* Right: Data */}
          <main className="space-y-6 min-w-0">
            <StatsCards incidents={incidents} />
            <FrequencyChart incidents={incidents} />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-heading text-foreground">Registros Recentes</h2>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar Excel
                </button>
              </div>
              <IncidentList incidents={incidents} onDelete={handleDelete} onEdit={handleEdit} onToggleResolved={handleToggleResolved} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
