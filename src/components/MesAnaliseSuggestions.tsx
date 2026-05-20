import { useMemo, useState } from "react";
import { Incident } from "@/lib/types";
import {
  computeMesAnaliseSuggestions,
  MES_ANALISE_TRIGGER_TYPES,
  MesAnaliseLevel,
  MesAnaliseSuggestion,
} from "@/lib/mes-analise-suggestions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, AlertCircle, Eye, Info, FileWarning, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSaveIncident } from "@/hooks/use-incidents";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  incidents: Incident[];
}

const LEVEL_META: Record<
  MesAnaliseLevel,
  { label: string; badge: string; icon: typeof AlertTriangle }
> = {
  critico: {
    label: "Crítico",
    badge: "bg-urgency-high/15 text-urgency-high border border-urgency-high/30",
    icon: AlertTriangle,
  },
  alerta: {
    label: "Alerta",
    badge: "bg-urgency-medium/15 text-urgency-medium border border-urgency-medium/30",
    icon: AlertCircle,
  },
  observacao: {
    label: "Observação",
    badge: "bg-urgency-low/15 text-urgency-low border border-urgency-low/30",
    icon: Info,
  },
};

export default function MesAnaliseSuggestions({ incidents }: Props) {
  const suggestions = useMemo(() => computeMesAnaliseSuggestions(incidents), [incidents]);
  const [selected, setSelected] = useState<MesAnaliseSuggestion | null>(null);
  const [markTarget, setMarkTarget] = useState<MesAnaliseSuggestion | null>(null);
  const { profileName } = useAuth();
  const saveIncident = useSaveIncident();

  const counts = useMemo(() => {
    const c = { critico: 0, alerta: 0, observacao: 0 };
    for (const s of suggestions) c[s.level]++;
    return c;
  }, [suggestions]);

  const handleConfirmMark = async () => {
    if (!markTarget) return;
    const breakdown = markTarget.byType.map((t) => `${t.type} ×${t.count}`).join(", ");
    const incident: Incident = {
      id: crypto.randomUUID(),
      teacherName: markTarget.canonicalName,
      coordinator: profileName || "Sistema",
      problemType: "Mês de análise",
      urgency: markTarget.level === "critico" ? "Alta" : markTarget.level === "alerta" ? "Média" : "Baixa",
      description:
        `Marcado automaticamente a partir da sugestão de Mês de Análise. ` +
        `Total de ${markTarget.totalCount} incidentes negativos: ${breakdown}.`,
      solution: "",
      needsFollowUp: true,
      resolved: false,
      underAnalysis: false,
      imageUrls: [],
      createdAt: new Date(),
      resolvedAt: null,
      incidentMode: "interno",
    };
    try {
      await saveIncident.mutateAsync({ incident, files: [] });
      toast.success(`${markTarget.canonicalName} marcado(a) como Mês de Análise`);
      setMarkTarget(null);
    } catch (e) {
      // toast handled by hook
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg shadow-[var(--card-shadow)] p-4">
        <h3 className="label-text mb-2">Sobre esta sugestão</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Os professores abaixo concentram incidentes que podem indicar a necessidade de entrar em{" "}
          <strong className="text-foreground">Mês de Análise</strong>. São contabilizados apenas
          registros dos seguintes tipos:{" "}
          <span className="text-foreground font-medium">
            {MES_ANALISE_TRIGGER_TYPES.join(", ")}
          </span>
          . Nomes parecidos (com possíveis erros de digitação) são agrupados automaticamente.{" "}
          <span className="text-foreground">No-Show e Reclamação contam em dobro</span> no cálculo do score.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-md bg-urgency-high/10 px-3 py-2 text-center">
            <div className="text-urgency-high font-bold text-lg tabular-nums">{counts.critico}</div>
            <div className="text-muted-foreground">Crítico (5+)</div>
          </div>
          <div className="rounded-md bg-urgency-medium/10 px-3 py-2 text-center">
            <div className="text-urgency-medium font-bold text-lg tabular-nums">{counts.alerta}</div>
            <div className="text-muted-foreground">Alerta (3–4)</div>
          </div>
          <div className="rounded-md bg-urgency-low/10 px-3 py-2 text-center">
            <div className="text-urgency-low font-bold text-lg tabular-nums">
              {counts.observacao}
            </div>
            <div className="text-muted-foreground">Observação (2)</div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-[var(--card-shadow)] p-4">
        <h3 className="label-text mb-3">
          Professores sugeridos ({suggestions.length})
        </h3>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Nenhum professor atinge o critério mínimo de 2 incidentes negativos.
          </p>
        ) : (
          <div className="space-y-2">
            {suggestions.map((s) => {
              const meta = LEVEL_META[s.level];
              const Icon = meta.icon;
              return (
                <div
                  key={s.canonicalName}
                  className="rounded-md border border-border p-3 space-y-2 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${meta.badge}`}
                        >
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                        <span className="font-semibold text-foreground truncate">
                          {s.canonicalName}
                        </span>
                        <span className="text-sm text-muted-foreground tabular-nums">
                          · {s.totalCount} incidente(s){s.score !== s.totalCount ? ` · score ${s.score}` : ""}
                        </span>
                      </div>
                      <div className="mt-1.5 text-xs text-muted-foreground">
                        {s.byType.map((t) => `${t.type} ×${t.count}`).join(" · ")}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">
                        Último em {format(s.lastIncidentAt, "dd/MM/yyyy", { locale: ptBR })}
                        {s.variations.length > 1 && (
                          <span className="ml-2">
                            · variações: {s.variations.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => setSelected(s)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver incidentes
                      </button>
                      <button
                        onClick={() => setMarkTarget(s)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-urgency-high/10 text-urgency-high hover:bg-urgency-high/20 border border-urgency-high/30 transition-colors"
                      >
                        <FileWarning className="w-3.5 h-3.5" />
                        Marcar Mês de Análise
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Incidentes negativos · {selected?.canonicalName}</DialogTitle>
            <DialogDescription>
              {selected?.totalCount} registro(s) considerado(s) para a sugestão.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {selected?.incidents.map((inc) => (
              <div
                key={inc.id}
                className="rounded-md border border-border p-3 text-sm space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{inc.problemType}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        inc.urgency === "Alta"
                          ? "bg-urgency-high/10 text-urgency-high"
                          : inc.urgency === "Média"
                          ? "bg-urgency-medium/10 text-urgency-medium"
                          : "bg-urgency-low/10 text-urgency-low"
                      }`}
                    >
                      {inc.urgency}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {format(inc.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <p className="text-xs text-foreground">
                  <strong>Professor:</strong> {inc.teacherName}
                </p>
                {inc.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3">{inc.description}</p>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={markTarget !== null} onOpenChange={(o) => !o && !saveIncident.isPending && setMarkTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar como Mês de Análise</DialogTitle>
            <DialogDescription>
              Será criado um incidente do tipo <strong>"Mês de análise"</strong> para{" "}
              <strong>{markTarget?.canonicalName}</strong>, com base em{" "}
              {markTarget?.totalCount} incidentes negativos contabilizados.
            </DialogDescription>
          </DialogHeader>
          {markTarget && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
              {markTarget.byType.map((t) => `${t.type} ×${t.count}`).join(" · ")}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkTarget(null)} disabled={saveIncident.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmMark} disabled={saveIncident.isPending}>
              {saveIncident.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
