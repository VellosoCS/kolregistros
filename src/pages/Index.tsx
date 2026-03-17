import { useState, useCallback, useEffect } from "react";
import { Incident } from "@/lib/types";
import { getIncidents, saveIncident, deleteIncident } from "@/lib/incidents-store";
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

  const handleSubmit = useCallback((incident: Incident) => {
    saveIncident(incident);
    setIncidents(getIncidents());

    if (incident.urgency === "Alta") {
      toast.error(`🚨 URGÊNCIA ALTA — ${incident.teacherName}: ${incident.description}`, {
        duration: 8000,
      });
    }

    if (incident.needsFollowUp) {
      toast.info(`📋 Acompanhamento criado para ${incident.teacherName}`, {
        duration: 4000,
      });
    }

    toast.success("Incidente registrado com sucesso", { duration: 2000 });
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteIncident(id);
    setIncidents(getIncidents());
    toast.success("Incidente excluído", { duration: 2000 });
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
              <IncidentList incidents={incidents} onDelete={handleDelete} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
