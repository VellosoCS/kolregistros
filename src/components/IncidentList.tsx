import { useState, useMemo } from "react";
import { Incident, ProblemType, UrgencyLevel, PROBLEM_TYPES, URGENCY_LEVELS, COORDINATORS, Coordinator } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Monitor, BookOpen, LayoutGrid, Users, Briefcase, DollarSign, Bell, Trash2, Search, FileText, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import IncidentReportDialog from "./IncidentReportDialog";
import EditIncidentDialog from "./EditIncidentDialog";

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
  onDelete?: (id: string) => void;
  onEdit?: (updated: Incident, newFiles: File[]) => void;
  onToggleResolved?: (id: string) => void;
}

export default function IncidentList({ incidents, onDelete, onEdit, onToggleResolved }: IncidentListProps) {
  const [filterType, setFilterType] = useState<ProblemType | "Todos">("Todos");
  const [filterUrgency, setFilterUrgency] = useState<UrgencyLevel | "Todas">("Todas");
  const [filterCoordinator, setFilterCoordinator] = useState<Coordinator | "Todos">("Todos");
  const [searchText, setSearchText] = useState("");
  const [reportIncident, setReportIncident] = useState<Incident | null>(null);
  const [editIncident, setEditIncident] = useState<Incident | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const filtered = incidents.filter((i) => {
    if (filterType !== "Todos" && i.problemType !== filterType) return false;
    if (filterUrgency !== "Todas" && i.urgency !== filterUrgency) return false;
    if (filterCoordinator !== "Todos" && i.coordinator !== filterCoordinator) return false;
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      if (
        !i.teacherName.toLowerCase().includes(q) &&
        !i.description.toLowerCase().includes(q) &&
        !(i.solution && i.solution.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

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
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Buscar por professor, descrição ou solução..."
          className="w-full pl-9 pr-3 py-2 bg-input text-body text-foreground rounded-md focus:ring-2 ring-ring outline-none transition-all placeholder:text-muted-foreground"
        />
      </div>

      {/* Filter pills */}
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
        <div className="flex items-center gap-1.5">
          <span className="label-text">Coordenador:</span>
          <div className="flex gap-1">
            {(["Todos", ...COORDINATORS] as const).map((name) => (
              <button
                key={name}
                onClick={() => setFilterCoordinator(name)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  filterCoordinator === name
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <table className="w-full text-body min-w-[800px]">
          <thead>
            <tr className="border-b border-border">
              <th className="label-text text-left px-4 py-3">Urgência</th>
              <th className="label-text text-left px-4 py-3">Professor</th>
              <th className="label-text text-left px-4 py-3">Coordenador</th>
              <th className="label-text text-left px-4 py-3">Tipo</th>
              <th className="label-text text-left px-4 py-3">Descrição</th>
              <th className="label-text text-left px-4 py-3">Solução</th>
              <th className="label-text text-left px-4 py-3">Imagens</th>
              <th className="label-text text-left px-4 py-3 w-8" title="Acompanhamento">
                <Bell className="w-3.5 h-3.5" />
              </th>
              <th className="label-text text-right px-4 py-3">Quando</th>
              <th className="label-text text-center px-4 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center text-muted-foreground py-12">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              paginatedItems.map((incident) => (
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
                  <td className="px-4 py-3 text-muted-foreground">{incident.coordinator}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      {PROBLEM_ICONS[incident.problemType]}
                      {incident.problemType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground max-w-[250px] truncate" title={incident.description}>{incident.description}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[300px]">
                    {incident.solution ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate cursor-default">{incident.solution}</span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-sm whitespace-normal">
                            {incident.solution}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {incident.imageUrls?.length > 0 ? (
                      <div className="flex gap-1">
                        {incident.imageUrls.slice(0, 3).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img src={url} alt={`Anexo ${i + 1}`} className="w-8 h-8 object-cover rounded border border-border" />
                          </a>
                        ))}
                        {incident.imageUrls.length > 3 && (
                          <span className="text-xs text-muted-foreground self-center">+{incident.imageUrls.length - 3}</span>
                        )}
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {incident.needsFollowUp && (
                      <span className="inline-block w-2 h-2 rounded-full bg-urgency-medium" title="Acompanhamento pendente" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground tabular-nums whitespace-nowrap">
                    {formatDistanceToNow(incident.createdAt, { addSuffix: true, locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-center flex items-center gap-1 justify-center">
                    <button
                      onClick={() => setEditIncident(incident)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Editar incidente"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setReportIncident(incident)}
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="Gerar relatório"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    {onDelete && (
                      <button
                        onClick={() => onDelete(incident.id)}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                        title="Excluir incidente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground tabular-nums">
          {filtered.length} de {incidents.length} registros
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground tabular-nums px-2">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {reportIncident && (
        <IncidentReportDialog incident={reportIncident} onClose={() => setReportIncident(null)} />
      )}

      {editIncident && onEdit && (
        <EditIncidentDialog
          incident={editIncident}
          onSave={(updated, files) => {
            onEdit(updated, files);
            setEditIncident(null);
          }}
          onClose={() => setEditIncident(null)}
        />
      )}
    </div>
  );
}
