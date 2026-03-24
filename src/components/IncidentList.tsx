import { useState, useMemo, useImperativeHandle, forwardRef, useRef as useReactRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Incident, ProblemType, UrgencyLevel, PROBLEM_TYPES, URGENCY_LEVELS } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Handshake, BookOpen, LayoutGrid, Users, Briefcase, DollarSign, HelpCircle, FileWarning, Bell, Trash2, Search, FileText, Pencil, ChevronLeft, ChevronRight, CheckCircle, Filter, Eye } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import IncidentReportDialog from "./IncidentReportDialog";
import EditIncidentDialog from "./EditIncidentDialog";
import ImageCarouselDialog from "./ImageCarouselDialog";

const PROBLEM_ICONS: Record<ProblemType, React.ReactNode> = {
  "Suporte": <Handshake className="w-3.5 h-3.5" />,
  "Didático": <BookOpen className="w-3.5 h-3.5" />,
  "Plataforma": <LayoutGrid className="w-3.5 h-3.5" />,
  "Aluno": <Users className="w-3.5 h-3.5" />,
  "Administrativo": <Briefcase className="w-3.5 h-3.5" />,
  "Financeiro": <DollarSign className="w-3.5 h-3.5" />,
  "Dúvida": <HelpCircle className="w-3.5 h-3.5" />,
  "Ocorrência": <FileWarning className="w-3.5 h-3.5" />,
};

function ResizableTh({ children, defaultWidth, align = "center" }: { children: React.ReactNode; defaultWidth: number; align?: "left" | "right" | "center" }) {
  const thRef = useReactRef<HTMLTableCellElement>(null);
  const startX = useReactRef(0);
  const startW = useReactRef(0);
  const [width, setWidth] = useState(defaultWidth);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    startW.current = width;
    const onMouseMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startX.current;
      setWidth(Math.max(50, startW.current + diff));
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [width]);

  return (
    <th
      ref={thRef}
      style={{ width: `${width}px`, minWidth: `${Math.min(width, 50)}px` }}
      className={`label-text px-4 py-3 relative select-none ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"}`}
    >
      {children}
      <span
        onMouseDown={onMouseDown}
        className="absolute right-0 top-0 bottom-0 w-px cursor-col-resize bg-border hover:bg-primary/50 active:bg-primary/70 transition-colors"
      />
    </th>
  );
}

interface IncidentListProps {
  incidents: Incident[];
  onDelete?: (id: string) => void;
  onEdit?: (updated: Incident, newFiles: File[]) => void;
  onToggleResolved?: (id: string) => void;
}

export interface IncidentListHandle {
  showFollowUpPending: () => void;
}

const IncidentList = forwardRef<IncidentListHandle, IncidentListProps>(({ incidents, onDelete, onEdit, onToggleResolved }, ref) => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<ProblemType | "Todos">("Todos");
  const [filterUrgency, setFilterUrgency] = useState<UrgencyLevel | "Todas">("Todas");
  const [filterCoordinator, setFilterCoordinator] = useState("");
  const [searchText, setSearchText] = useState("");
  const [reportIncident, setReportIncident] = useState<Incident | null>(null);
  const [editIncident, setEditIncident] = useState<Incident | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterFollowUp, setFilterFollowUp] = useState(false);
  const [carouselImages, setCarouselImages] = useState<string[] | null>(null);
  const [carouselStart, setCarouselStart] = useState(0);
  const pageSize = 10;
  useImperativeHandle(ref, () => ({
    showFollowUpPending: () => {
      setFilterFollowUp(true);
      setCurrentPage(1);
    },
  }));

  const filtered = incidents.filter((i) => {
    if (filterFollowUp && (!i.needsFollowUp || i.resolved)) return false;
    if (filterType !== "Todos" && i.problemType !== filterType) return false;
    if (filterUrgency !== "Todas" && i.urgency !== filterUrgency) return false;
    if (filterCoordinator.trim() && !i.coordinator.toLowerCase().includes(filterCoordinator.toLowerCase())) return false;
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
      Alta: "bg-urgency-high/15 text-urgency-high border border-urgency-high/30",
      Média: "bg-urgency-medium/15 text-urgency-medium border border-urgency-medium/30",
      Baixa: "bg-urgency-low/15 text-urgency-low border border-urgency-low/30",
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
          <span className="label-text">Responsável:</span>
          <input
            type="text"
            value={filterCoordinator}
            onChange={(e) => setFilterCoordinator(e.target.value)}
            placeholder="Filtrar..."
            className="px-2.5 py-1 text-xs bg-input text-foreground rounded-md focus:ring-2 ring-ring outline-none transition-all placeholder:text-muted-foreground w-32"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterFollowUp(!filterFollowUp)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              filterFollowUp
                ? "bg-urgency-medium text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            🔔 Acompanhamento pendente
          </button>
        </div>
      </div>

      {/* Filtered count card */}
      <div className="bg-card rounded-lg shadow-card p-3 flex items-center gap-2">
        <Filter className="w-4 h-4 text-primary" />
        <span className="text-lg font-bold tabular-nums text-foreground">{filtered.length}</span>
        <span className="text-xs text-muted-foreground">
          de {incidents.length} registros filtrados
        </span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg shadow-card overflow-x-auto">
        <table className="w-full text-body min-w-[800px] table-fixed [&_th+th]:border-l [&_th+th]:border-border [&_td+td]:border-l [&_td+td]:border-border">
          <thead>
            <tr className="border-b border-border">
              <th className="label-text text-center px-4 py-3 w-12" title="Resolvido">
                <CheckCircle className="w-3.5 h-3.5 mx-auto" />
              </th>
              <ResizableTh defaultWidth={90}>Urgência</ResizableTh>
              <ResizableTh defaultWidth={130}>Professor</ResizableTh>
              <ResizableTh defaultWidth={130}>Responsável</ResizableTh>
              <ResizableTh defaultWidth={120}>Tipo</ResizableTh>
              <ResizableTh defaultWidth={220}>Descrição</ResizableTh>
              <ResizableTh defaultWidth={180}>Solução</ResizableTh>
              <ResizableTh defaultWidth={100}>Imagens</ResizableTh>
              <th className="label-text text-center px-4 py-3 w-10" title="Acompanhamento">
                <Bell className="w-3.5 h-3.5 mx-auto" />
              </th>
              <ResizableTh defaultWidth={140}>Data</ResizableTh>
              <th className="label-text text-center px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center text-muted-foreground py-12">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              paginatedItems.map((incident) => (
                <tr
                  key={incident.id}
                  className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors animate-slide-in ${incident.resolved ? "bg-green-50 dark:bg-green-950/30" : "bg-yellow-50 dark:bg-yellow-950/30"}`}
                >
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={incident.resolved}
                      onChange={() => onToggleResolved?.(incident.id)}
                      className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                      title={incident.resolved ? "Marcar como pendente" : "Marcar como resolvido"}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-16 px-2.5 py-1 text-xs font-semibold rounded-md ${urgencyBadge(incident.urgency)}`}>
                      {incident.urgency}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-foreground">{incident.teacherName}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{incident.coordinator}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center gap-1.5 text-muted-foreground">
                      {PROBLEM_ICONS[incident.problemType]}
                      {incident.problemType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-foreground max-w-[250px] truncate" title={incident.description}>{incident.description}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground max-w-[300px]">
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
                  <td className="px-4 py-3 text-center">
                    {incident.imageUrls?.length > 0 ? (
                      <div className="flex gap-1 justify-center cursor-pointer" onClick={() => { setCarouselImages(incident.imageUrls); setCarouselStart(0); }}>
                        {incident.imageUrls.slice(0, 3).map((url, i) => (
                          <img key={i} src={url} alt={`Anexo ${i + 1}`} className="w-8 h-8 object-cover rounded border border-border" />
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
                    {format(incident.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-center flex items-center gap-1 justify-center">
                    <button
                      onClick={() => navigate(`/incidente/${incident.id}`)}
                      className="text-primary hover:text-primary/80 transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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
                        onClick={() => {
                          if (window.confirm(`Deseja realmente excluir o incidente de "${incident.teacherName}"?`)) {
                            onDelete(incident.id);
                          }
                        }}
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
      {carouselImages && (
        <ImageCarouselDialog images={carouselImages} initialIndex={carouselStart} onClose={() => setCarouselImages(null)} />
      )}
    </div>
  );
});

IncidentList.displayName = "IncidentList";
export default IncidentList;
