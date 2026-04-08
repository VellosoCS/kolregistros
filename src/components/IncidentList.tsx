import { useState, useMemo, useImperativeHandle, forwardRef, useRef as useReactRef, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Incident, ProblemType, UrgencyLevel, PROBLEM_TYPES, URGENCY_LEVELS } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Handshake, BookOpen, LayoutGrid, Users, Briefcase, DollarSign, HelpCircle, FileWarning, Bell, Trash2, Search, FileText, Pencil, ChevronLeft, ChevronRight, CheckCircle, Filter, Eye, Download, X, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import IncidentReportDialog from "./IncidentReportDialog";
import EditIncidentDialog from "./EditIncidentDialog";
import ImageCarouselDialog from "./ImageCarouselDialog";
import { toast } from "sonner";

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

function ResizableTh({ children, defaultWidth, align = "center", columnId }: { children: React.ReactNode; defaultWidth: number; align?: "left" | "right" | "center"; columnId?: string }) {
  const thRef = useReactRef<HTMLTableCellElement>(null);
  const startX = useReactRef(0);
  const startW = useReactRef(0);
  const storageKey = columnId ? `col-width-${columnId}` : null;
  const [width, setWidth] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) return Number(saved);
    }
    return defaultWidth;
  });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    startW.current = width;
    const onMouseMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startX.current;
      const newW = Math.max(50, startW.current + diff);
      setWidth(newW);
      if (storageKey) localStorage.setItem(storageKey, String(newW));
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [width, storageKey]);

  return (
    <th
      ref={thRef}
      style={{ width: `${width}px`, minWidth: `${Math.min(width, 50)}px`, maxWidth: `${width}px` }}
      className={`label-text px-4 py-3 relative select-none overflow-hidden text-ellipsis whitespace-nowrap ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"}`}
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
  hideTeacher?: boolean;
}

export interface IncidentListHandle {
  showFollowUpPending: () => void;
}

const IncidentList = forwardRef<IncidentListHandle, IncidentListProps>(({ incidents, onDelete, onEdit, onToggleResolved, hideTeacher = false }, ref) => {
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
  const [textPopup, setTextPopup] = useState<{ title: string; content: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("incident-page-size");
    return saved ? Number(saved) : 10;
  });
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

  const showAll = pageSize === 0;
  const displayItems = showAll ? filtered : filtered;
  const totalPages = showAll ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedItems = showAll ? filtered : filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = 48;

  const rowVirtualizer = useVirtualizer({
    count: paginatedItems.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  const useVirtual = paginatedItems.length > 50;

  const urgencyBadge = (level: UrgencyLevel) => {
    const styles: Record<UrgencyLevel, string> = {
      Alta: "bg-urgency-high/15 text-urgency-high border border-urgency-high/30",
      Média: "bg-urgency-medium/15 text-urgency-medium border border-urgency-medium/30",
      Baixa: "bg-urgency-low/15 text-urgency-low border border-urgency-low/30",
    };
    return styles[level];
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const allPageSelected = paginatedItems.length > 0 && paginatedItems.every((i) => selectedIds.has(i.id));
  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        paginatedItems.forEach((i) => next.delete(i.id));
      } else {
        paginatedItems.forEach((i) => next.add(i.id));
      }
      return next;
    });
  }, [allPageSelected, paginatedItems]);

  const getSelectedReportData = useCallback(() => {
    const selected = incidents.filter((i) => selectedIds.has(i.id));
    if (selected.length === 0) return null;
    const typeCounts: Record<string, number> = {};
    selected.forEach((i) => (typeCounts[i.problemType] = (typeCounts[i.problemType] || 0) + 1));
    const typeCountsArr = Object.entries(typeCounts)
      .map(([type, count]) => ({ type: type as ProblemType, count }))
      .sort((a, b) => b.count - a.count);
    const urgencyCounts = {
      alta: selected.filter((i) => i.urgency === "Alta").length,
      media: selected.filter((i) => i.urgency === "Média").length,
      baixa: selected.filter((i) => i.urgency === "Baixa").length,
    };
    const dates = selected.map((i) => new Date(i.createdAt).getTime());
    const dateRange = { start: new Date(Math.min(...dates)), end: new Date(Math.max(...dates)) };
    return { selected, typeCountsArr, urgencyCounts, dateRange };
  }, [incidents, selectedIds]);

  const handleBatchReport = useCallback(async () => {
    const data = getSelectedReportData();
    if (!data) return;
    const { generateReportPDF } = await import("@/lib/report-pdf");
    generateReportPDF(data.selected, data.typeCountsArr, data.urgencyCounts, data.dateRange, "week");
    toast.success(`Relatório PDF gerado com ${data.selected.length} incidente(s)`);
  }, [getSelectedReportData]);

  const handleBatchReportDOCX = useCallback(async () => {
    const data = getSelectedReportData();
    if (!data) return;
    const { generateReportDOCX } = await import("@/lib/report-docx");
    generateReportDOCX(data.selected, data.typeCountsArr, data.urgencyCounts, data.dateRange, "week");
    toast.success(`Relatório Word gerado com ${data.selected.length} incidente(s)`);
  }, [getSelectedReportData]);

  const renderRowCells = (incident: Incident) => (
    <>
      <td className="px-2 py-3 text-center">
        <input
          type="checkbox"
          checked={selectedIds.has(incident.id)}
          onChange={() => toggleSelect(incident.id)}
          className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
          title="Selecionar para relatório"
        />
      </td>
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
      {!hideTeacher && <td className="px-4 py-3 text-center font-medium text-foreground overflow-hidden text-ellipsis whitespace-nowrap">{incident.teacherName}</td>}
      <td className="px-4 py-3 text-center text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">{incident.coordinator}</td>
      <td className="px-4 py-3 text-center overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="inline-flex items-center justify-center gap-1.5 text-muted-foreground truncate">
          {PROBLEM_ICONS[incident.problemType]}
          {incident.problemType}
          {incident.problemType === "Mês de análise" && !incident.resolved && (() => {
            const days = Math.floor((Date.now() - incident.createdAt.getTime()) / (1000 * 60 * 60 * 24));
            return days >= 30 ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-destructive/15 text-destructive animate-pulse">
                    <Clock className="w-3 h-3" />
                    {days}d
                  </span>
                </TooltipTrigger>
                <TooltipContent>Incidente com {days} dias — lembrete de 30 dias</TooltipContent>
              </Tooltip>
            ) : null;
          })()}
        </span>
      </td>
      <td className="px-4 py-3 text-center text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
        <span
          className="block truncate cursor-pointer hover:text-primary transition-colors"
          title="Clique para ver completo"
          onClick={() => setTextPopup({ title: "Descrição", content: incident.description })}
        >
          {incident.description}
        </span>
      </td>
      <td className="px-4 py-3 text-center text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
        {incident.solution ? (
          <span
            className="block truncate cursor-pointer hover:text-primary transition-colors"
            title="Clique para ver completo"
            onClick={() => setTextPopup({ title: "Solução", content: incident.solution })}
          >
            {incident.solution}
          </span>
        ) : "—"}
      </td>
      <td className="px-4 py-3 text-center overflow-hidden">
        {incident.imageUrls?.length > 0 ? (
          <div className="flex gap-1 justify-center items-center cursor-pointer flex-wrap max-w-full overflow-hidden" onClick={() => { setCarouselImages(incident.imageUrls); setCarouselStart(0); }}>
            {incident.imageUrls.slice(0, 2).map((url, i) => (
              <img key={i} src={url} alt={`Anexo ${i + 1}`} className="w-7 h-7 min-w-0 shrink-0 object-cover rounded border border-border" />
            ))}
            {incident.imageUrls.length > 2 && (
              <span className="text-xs text-muted-foreground shrink-0">+{incident.imageUrls.length - 2}</span>
            )}
          </div>
        ) : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex w-full items-center justify-center">
          {incident.needsFollowUp && (
            <span className="w-2 h-2 rounded-full bg-urgency-medium" title="Acompanhamento pendente" />
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center text-muted-foreground tabular-nums whitespace-nowrap">
        {format(incident.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
      </td>
      <td className="px-4 py-3 text-center flex items-center gap-1 justify-center">
        <button onClick={() => navigate(`/incidente/${incident.id}`)} className="text-primary hover:text-primary/80 transition-colors" title="Ver detalhes">
          <Eye className="w-4 h-4" />
        </button>
        <button onClick={() => setEditIncident(incident)} className="text-muted-foreground hover:text-foreground transition-colors" title="Editar incidente">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => setReportIncident(incident)} className="text-primary hover:text-primary/80 transition-colors" title="Gerar relatório">
          <FileText className="w-4 h-4" />
        </button>
        {onDelete && (
          <button
            onClick={() => { if (window.confirm(`Deseja realmente excluir o incidente de "${incident.teacherName}"?`)) onDelete(incident.id); }}
            className="text-destructive hover:text-destructive/80 transition-colors"
            title="Excluir incidente"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </td>
    </>
  );


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
      <div ref={tableContainerRef} className="bg-card rounded-lg shadow-card overflow-x-auto" style={useVirtual ? { maxHeight: '600px', overflowY: 'auto' } : undefined}>
        <table className="w-full text-body min-w-[800px] table-fixed [&_th+th]:border-l [&_th+th]:border-border [&_td+td]:border-l [&_td+td]:border-border">
          <thead className={useVirtual ? "sticky top-0 z-10 bg-card" : ""}>
            <tr className="border-b border-border">
              <th className="label-text text-center px-2 py-3 w-10" title="Selecionar">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer"
                  title="Selecionar todos da página"
                />
              </th>
              <th className="label-text text-center px-4 py-3 w-12" title="Resolvido">
                <CheckCircle className="w-3.5 h-3.5 mx-auto" />
              </th>
              <ResizableTh defaultWidth={100} columnId="urgency">Urgência</ResizableTh>
              {!hideTeacher && <ResizableTh defaultWidth={200} columnId="teacher">Professor</ResizableTh>}
              <ResizableTh defaultWidth={150} columnId="coordinator">Responsável</ResizableTh>
              <ResizableTh defaultWidth={140} columnId="type">Tipo</ResizableTh>
              <ResizableTh defaultWidth={260} columnId="description">Descrição</ResizableTh>
              <ResizableTh defaultWidth={220} columnId="solution">Solução</ResizableTh>
              <ResizableTh defaultWidth={90} columnId="images">Imagens</ResizableTh>
              <th className="label-text text-center px-4 py-3 w-10" title="Acompanhamento">
                <Bell className="w-3.5 h-3.5 mx-auto" />
              </th>
              <ResizableTh defaultWidth={140} columnId="date">Data</ResizableTh>
              <th className="label-text text-center px-4 py-3 w-20">Opções</th>
            </tr>
          </thead>
          <tbody style={useVirtual ? { height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative', display: 'block' } : undefined}>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={hideTeacher ? 11 : 12} className="text-center text-muted-foreground py-12">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : useVirtual ? (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const incident = paginatedItems[virtualRow.index];
                return (
                  <tr
                    key={incident.id}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                      display: 'table',
                      tableLayout: 'fixed',
                    }}
                    className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors ${incident.resolved ? "bg-green-50 dark:bg-green-950/30" : "bg-yellow-50 dark:bg-yellow-950/30"}`}
                  >
                    {renderRowCells(incident)}
                  </tr>
                );
              })
            ) : (
              paginatedItems.map((incident) => (
                <tr
                  key={incident.id}
                  className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors animate-slide-in ${incident.resolved ? "bg-green-50 dark:bg-green-950/30" : "bg-yellow-50 dark:bg-yellow-950/30"}`}
                >
                  {renderRowCells(incident)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-muted-foreground tabular-nums">
          {filtered.length} de {incidents.length} registros
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPageSize(val);
                localStorage.setItem("incident-page-size", String(val));
                setCurrentPage(1);
              }}
              className="text-xs bg-secondary text-foreground rounded-md px-2 py-1 border border-border cursor-pointer"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={safePage <= 1}
                className="px-1.5 py-1 text-xs rounded-md bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {(() => {
                const pages: (number | "...")[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (safePage > 3) pages.push("...");
                  for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
                  if (safePage < totalPages - 2) pages.push("...");
                  pages.push(totalPages);
                }
                return pages.map((p, idx) =>
                  p === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-[28px] h-7 text-xs font-medium rounded-md transition-all ${
                        safePage === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  )
                );
              })()}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={safePage >= totalPages}
                className="px-1.5 py-1 text-xs rounded-md bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
              >
                »
              </button>
            </div>
          )}
        </div>
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

      <Dialog open={!!textPopup} onOpenChange={(open) => !open && setTextPopup(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{textPopup?.title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {textPopup?.content}
          </p>
        </DialogContent>
      </Dialog>

      {/* Floating selection action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl shadow-lg px-5 py-3 flex items-center gap-4 animate-slide-up">
          <span className="text-sm font-medium text-foreground tabular-nums">
            {selectedIds.size} selecionado(s)
          </span>
          <button
            onClick={handleBatchReport}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={handleBatchReportDOCX}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
          >
            <Download className="w-4 h-4" />
            Word
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Limpar seleção"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
});

IncidentList.displayName = "IncidentList";
export default IncidentList;
