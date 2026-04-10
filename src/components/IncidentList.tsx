import { useState, useMemo, useImperativeHandle, forwardRef, useCallback, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Incident, ProblemType, UrgencyLevel } from "@/lib/types";
import { Bell, CheckCircle, Filter } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import IncidentReportDialog from "./IncidentReportDialog";
import EditIncidentDialog from "./EditIncidentDialog";
import ImageCarouselDialog from "./ImageCarouselDialog";
import { toast } from "sonner";
import { useIncidentsPaginated } from "@/hooks/use-incidents";
import { Skeleton } from "@/components/ui/skeleton";

import ResizableTh from "./incident-list/ResizableTh";
import IncidentFilters from "./incident-list/IncidentFilters";
import IncidentTableRow from "./incident-list/IncidentTableRow";
import IncidentPagination from "./incident-list/IncidentPagination";
import SelectionActionBar from "./incident-list/SelectionActionBar";

interface IncidentListProps {
  incidents?: Incident[];
  onDelete?: (id: string) => void;
  onEdit?: (updated: Incident, newFiles: File[]) => void;
  onToggleResolved?: (id: string) => void;
  hideTeacher?: boolean;
  incidentMode?: "professor" | "interno";
  resolvedFilter?: boolean;
}

export interface IncidentListHandle {
  showFollowUpPending: () => void;
}

const IncidentList = forwardRef<IncidentListHandle, IncidentListProps>(({
  incidents: propIncidents, onDelete, onEdit, onToggleResolved,
  hideTeacher = false, incidentMode, resolvedFilter,
}, ref) => {
  // --- Filter state ---
  const [filterType, setFilterType] = useState<ProblemType | "Todos">("Todos");
  const [filterUrgency, setFilterUrgency] = useState<UrgencyLevel | "Todas">("Todas");
  const [filterCoordinator, setFilterCoordinator] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filterFollowUp, setFilterFollowUp] = useState(false);

  // --- UI state ---
  const [reportIncident, setReportIncident] = useState<Incident | null>(null);
  const [editIncident, setEditIncident] = useState<Incident | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [carouselImages, setCarouselImages] = useState<string[] | null>(null);
  const [carouselStart, setCarouselStart] = useState(0);
  const [textPopup, setTextPopup] = useState<{ title: string; content: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem("incident-page-size");
    return saved ? Number(saved) : 10;
  });

  // --- Debounced search ---
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => { setCurrentPage(1); }, [filterType, filterUrgency, filterCoordinator, filterFollowUp]);

  useImperativeHandle(ref, () => ({
    showFollowUpPending: () => {
      setFilterFollowUp(true);
      setCurrentPage(1);
    },
  }));

  // --- Data fetching ---
  const useServerSide = !propIncidents;

  const { data: paginatedResult, isLoading: isServerLoading, isError: isServerError } = useIncidentsPaginated({
    page: currentPage,
    pageSize,
    incidentMode,
    resolved: resolvedFilter,
    search: debouncedSearch || undefined,
    problemType: filterType !== "Todos" ? filterType : undefined,
    urgency: filterUrgency !== "Todas" ? filterUrgency : undefined,
    coordinator: filterCoordinator || undefined,
    needsFollowUp: filterFollowUp || undefined,
  });

  const clientFiltered = useMemo(() => {
    if (useServerSide || !propIncidents) return [];
    return propIncidents.filter((i) => {
      if (filterFollowUp && (!i.needsFollowUp || i.resolved)) return false;
      if (filterType !== "Todos" && i.problemType !== filterType) return false;
      if (filterUrgency !== "Todas" && i.urgency !== filterUrgency) return false;
      if (filterCoordinator.trim() && !i.coordinator.toLowerCase().includes(filterCoordinator.toLowerCase())) return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        if (!i.teacherName.toLowerCase().includes(q) && !i.description.toLowerCase().includes(q) && !(i.solution && i.solution.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [propIncidents, filterFollowUp, filterType, filterUrgency, filterCoordinator, searchText, useServerSide]);

  const incidents = useServerSide ? (paginatedResult?.data ?? []) : propIncidents ?? [];
  const totalCount = useServerSide ? (paginatedResult?.count ?? 0) : (propIncidents?.length ?? 0);
  const filteredCount = useServerSide ? (paginatedResult?.count ?? 0) : clientFiltered.length;

  const showAll = pageSize === 0;
  const totalPages = useServerSide
    ? (showAll ? 1 : Math.max(1, Math.ceil(filteredCount / pageSize)))
    : (showAll ? 1 : Math.max(1, Math.ceil(clientFiltered.length / pageSize)));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useServerSide
    ? (paginatedResult?.data ?? [])
    : (showAll ? clientFiltered : clientFiltered.slice((safePage - 1) * pageSize, safePage * pageSize));

  // --- Virtualizer ---
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = 48;
  const rowVirtualizer = useVirtualizer({
    count: paginatedItems.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });
  const useVirtual = paginatedItems.length > 50;

  // --- Selection ---
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

  // --- Page size handler ---
  const handlePageSizeChange = useCallback((val: number) => {
    setPageSize(val);
    localStorage.setItem("incident-page-size", String(val));
    setCurrentPage(1);
  }, []);

  const colSpan = hideTeacher ? 11 : 12;

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <IncidentFilters
          searchText={searchText}
          onSearchChange={setSearchText}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
          filterUrgency={filterUrgency}
          onFilterUrgencyChange={setFilterUrgency}
          filterCoordinator={filterCoordinator}
          onFilterCoordinatorChange={setFilterCoordinator}
          filterFollowUp={filterFollowUp}
          onFilterFollowUpChange={setFilterFollowUp}
        />

        {/* Filtered count */}
        <div className="bg-card rounded-lg shadow-card p-3 flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-lg font-bold tabular-nums text-foreground">{filteredCount}</span>
          <span className="text-xs text-muted-foreground">de {totalCount} registros filtrados</span>
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
              {isServerLoading && useServerSide ? (
                Array.from({ length: Math.min(pageSize || 5, 5) }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={colSpan} className="px-4 py-3">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : isServerError && useServerSide ? (
                <tr>
                  <td colSpan={colSpan} className="text-center text-destructive py-12">
                    Erro ao carregar registros. Tente recarregar a página.
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="text-center text-muted-foreground py-12">
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
                        position: 'absolute', top: 0, left: 0, width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                        display: 'table', tableLayout: 'fixed',
                      }}
                      className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors ${incident.resolved ? "bg-urgency-low/5" : "bg-urgency-medium/5"}`}
                    >
                      <IncidentTableRow
                        incident={incident}
                        isSelected={selectedIds.has(incident.id)}
                        onToggleSelect={toggleSelect}
                        onToggleResolved={onToggleResolved}
                        onEdit={setEditIncident}
                        onReport={setReportIncident}
                        onDelete={onDelete}
                        onImageClick={(urls, idx) => { setCarouselImages(urls); setCarouselStart(idx); }}
                        onTextClick={(title, content) => setTextPopup({ title, content })}
                        hideTeacher={hideTeacher}
                      />
                    </tr>
                  );
                })
              ) : (
                paginatedItems.map((incident) => (
                  <tr
                    key={incident.id}
                    className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors animate-slide-in ${incident.resolved ? "bg-urgency-low/5" : "bg-urgency-medium/5"}`}
                  >
                    <IncidentTableRow
                      incident={incident}
                      isSelected={selectedIds.has(incident.id)}
                      onToggleSelect={toggleSelect}
                      onToggleResolved={onToggleResolved}
                      onEdit={setEditIncident}
                      onReport={setReportIncident}
                      onDelete={onDelete}
                      onImageClick={(urls, idx) => { setCarouselImages(urls); setCarouselStart(idx); }}
                      onTextClick={(title, content) => setTextPopup({ title, content })}
                      hideTeacher={hideTeacher}
                    />
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <IncidentPagination
          filteredCount={filteredCount}
          totalCount={totalCount}
          pageSize={pageSize}
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />

        {/* Dialogs */}
        {reportIncident && (
          <IncidentReportDialog incident={reportIncident} onClose={() => setReportIncident(null)} />
        )}
        {editIncident && onEdit && (
          <EditIncidentDialog
            incident={editIncident}
            onSave={(updated, files) => { onEdit(updated, files); setEditIncident(null); }}
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

        <SelectionActionBar
          count={selectedIds.size}
          onExportPDF={handleBatchReport}
          onExportDOCX={handleBatchReportDOCX}
          onClear={() => setSelectedIds(new Set())}
        />
      </div>
    </TooltipProvider>
  );
});

IncidentList.displayName = "IncidentList";
export default IncidentList;
