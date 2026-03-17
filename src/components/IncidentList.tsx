import { useState } from "react";
import { Incident, ProblemType, UrgencyLevel, PROBLEM_TYPES, URGENCY_LEVELS } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Monitor, BookOpen, LayoutGrid, Users, Briefcase, DollarSign, Bell } from "lucide-react";

const PROBLEM_ICONS: Record<ProblemType, React.ReactNode> = {
  "Técnico": <Monitor className="w-3.5 h-3.5" />,
  "Didático": <BookOpen className="w-3.5 h-3.5" />,
  "Plataforma": <LayoutGrid className="w-3.5 h-3.5" />,
  "Aluno": <Users className="w-3.5 h-3.5" />,
  "Administrativo": <Briefcase className="w-3.5 h-3.5" />,
  "Financeiro": <DollarSign className="w-3.5 h-3.5" />,
};

interface IncidentListProps {
  incidents: Incident[];
}

export default function IncidentList({ incidents }: IncidentListProps) {
  const [filterType, setFilterType] = useState<ProblemType | "Todos">("Todos");
  const [filterUrgency, setFilterUrgency] = useState<UrgencyLevel | "Todas">("Todas");

  const filtered = incidents.filter((i) => {
    if (filterType !== "Todos" && i.problemType !== filterType) return false;
    if (filterUrgency !== "Todas" && i.urgency !== filterUrgency) return false;
    return true;
  });

  const urgencyBadge = (level: UrgencyLevel) => {
    const styles: Record<UrgencyLevel, string> = {
      Alta: "bg-urgency-high-bg text-urgency-high",
      Média: "bg-urgency-medium-bg text-urgency-medium",
      Baixa: "bg-urgency-low-bg text-urgency-low",
    };
    return styles[level];
  };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 mr-2">
          <span className="label-text">Tipo:</span>
          <div className="flex gap-1">
            {(["Todos", ...PROBLEM_TYPES] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  filterType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="label-text">Urgência:</span>
          <div className="flex gap-1">
            {(["Todas", ...URGENCY_LEVELS] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFilterUrgency(level)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  filterUrgency === level
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg shadow-card overflow-hidden">
        <table className="w-full text-body">
          <thead>
            <tr className="border-b border-border">
              <th className="label-text text-left px-4 py-3">Urgência</th>
              <th className="label-text text-left px-4 py-3">Professor</th>
              <th className="label-text text-left px-4 py-3">Tipo</th>
              <th className="label-text text-left px-4 py-3">Descrição</th>
              <th className="label-text text-left px-4 py-3">Solução</th>
              <th className="label-text text-left px-4 py-3 w-8" title="Acompanhamento">
                <Bell className="w-3.5 h-3.5" />
              </th>
              <th className="label-text text-right px-4 py-3">Quando</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted-foreground py-12">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((incident) => (
                <tr
                  key={incident.id}
                  className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors animate-slide-in"
                >
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${urgencyBadge(incident.urgency)}`}>
                      {incident.urgency}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{incident.teacherName}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      {PROBLEM_ICONS[incident.problemType]}
                      {incident.problemType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground max-w-[200px] truncate">{incident.description}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{incident.solution || "—"}</td>
                  <td className="px-4 py-3 text-center">
                    {incident.needsFollowUp && (
                      <span className="inline-block w-2 h-2 rounded-full bg-urgency-medium" title="Acompanhamento pendente" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                    {formatDistanceToNow(incident.createdAt, { addSuffix: true, locale: ptBR })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-right tabular-nums">
        {filtered.length} de {incidents.length} registros
      </p>
    </div>
  );
}
