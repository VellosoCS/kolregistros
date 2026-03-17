import { useState, useCallback } from "react";
import { Incident } from "@/lib/types";
import { getIncidents, saveIncident, deleteIncident } from "@/lib/incidents-store";
import IncidentForm from "@/components/IncidentForm";
import IncidentList from "@/components/IncidentList";
import StatsCards from "@/components/StatsCards";
import FrequencyChart from "@/components/FrequencyChart";
import { toast } from "sonner";
import { Zap, Download } from "lucide-react";
import * as XLSX from "xlsx";

export default function Index() {
  const [incidents, setIncidents] = useState<Incident[]>(getIncidents);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h1 className="text-heading text-foreground">Support Pulse</h1>
          <span className="text-xs text-muted-foreground ml-1">Registro de Incidentes</span>
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
              <h2 className="text-heading text-foreground mb-3">Registros Recentes</h2>
              <IncidentList incidents={incidents} onDelete={handleDelete} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
