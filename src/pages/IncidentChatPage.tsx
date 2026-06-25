import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, User, Briefcase, AlertTriangle } from "lucide-react";
import IncidentChat from "@/components/IncidentChat";
import { toast } from "sonner";
import { UrgencyLevel } from "@/lib/types";

interface IncidentLite {
  id: string;
  teacher_name: string;
  coordinator: string;
  problem_type: string;
  urgency: UrgencyLevel;
  resolved: boolean;
}

const URGENCY_STYLES: Record<UrgencyLevel, string> = {
  Alta: "bg-urgency-high/15 text-urgency-high border border-urgency-high/30",
  Média: "bg-urgency-medium/15 text-urgency-medium border border-urgency-medium/30",
  Baixa: "bg-urgency-low/15 text-urgency-low border border-urgency-low/30",
};

export default function IncidentChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<IncidentLite | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("incidents")
        .select("id, teacher_name, coordinator, problem_type, urgency, resolved")
        .eq("id", id)
        .single();
      if (error) {
        toast.error("Erro ao carregar incidente.");
      } else {
        setIncident(data as IncidentLite);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando chat...</p>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <p className="text-muted-foreground text-lg">Incidente não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
              Chat do Incidente
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              Converse sobre este incidente em tempo real
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate(`/incidente/${incident.id}`)}>
            <Eye className="w-4 h-4 mr-2" />
            Ver detalhes
          </Button>
        </div>

        <div className="bg-card rounded-xl shadow-card p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-md ${URGENCY_STYLES[incident.urgency]}`}>
              {incident.urgency}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-secondary text-foreground">
              <AlertTriangle className="w-3.5 h-3.5" />
              {incident.problem_type}
            </span>
            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-md ${
              incident.resolved
                ? "bg-urgency-low/15 text-urgency-low border border-urgency-low/30"
                : "bg-urgency-high/15 text-urgency-high border border-urgency-high/30"
            }`}>
              {incident.resolved ? "Resolvido" : "Pendente"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-foreground">
              <User className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Professor:</span>
              <span className="font-medium truncate">{incident.teacher_name}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Responsável:</span>
              <span className="font-medium truncate">{incident.coordinator}</span>
            </div>
          </div>
        </div>

        <IncidentChat incidentId={incident.id} />
      </div>
    </div>
  );
}
