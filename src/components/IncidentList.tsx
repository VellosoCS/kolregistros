import { useState, useMemo, useImperativeHandle, forwardRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Incident, ProblemType, UrgencyLevel } from "@/lib/types";
import { TooltipProvider } from "@/components/ui/tooltip";
import IncidentReportDialog from "./IncidentReportDialog";
import EditIncidentDialog from "./EditIncidentDialog";
import ImageCarouselDialog from "./ImageCarouselDialog";
import { useIncidentsPaginated } from "@/hooks/use-incidents";
import { useIncidentSelection } from "@/hooks/use-incident-selection";

import IncidentFilters from "./incident-list/IncidentFilters";
import IncidentTable from "./incident-list/IncidentTable";
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

  // --- Selection (extracted hook) ---
  const {
    selectedIds, toggleSelect, toggleSelectAll: toggleSelectAllFn,
    clearSelection, handleBatchPDF, handleBatchDOCX,
  } = useIncidentSelection(incidents);

  const allPageSelected = paginatedItems.length > 0 && paginatedItems.every((i) => selectedIds.has(i.id));
  const handleToggleSelectAll = useCallback(() => toggleSelectAllFn(paginatedItems), [toggleSelectAllFn, paginatedItems]);

  // --- Page size handler ---
  const handlePageSizeChange = useCallback((val: number) => {
    setPageSize(val);
    localStorage.setItem("incident-page-size", String(val));
    setCurrentPage(1);
  }, []);

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

        <IncidentTable
          items={paginatedItems}
          filteredCount={filteredCount}
          totalCount={totalCount}
          isLoading={isServerLoading}
          isError={isServerError}
          useServerSide={useServerSide}
          hideTeacher={hideTeacher}
          selectedIds={selectedIds}
          allPageSelected={allPageSelected}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleResolved={onToggleResolved}
          onEdit={setEditIncident}
          onReport={setReportIncident}
          onDelete={onDelete}
          onImageClick={(urls, idx) => { setCarouselImages(urls); setCarouselStart(idx); }}
          onTextClick={(title, content) => setTextPopup({ title, content })}
        />

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
          onExportPDF={handleBatchPDF}
          onExportDOCX={handleBatchDOCX}
          onClear={clearSelection}
        />
      </div>
    </TooltipProvider>
  );
});

IncidentList.displayName = "IncidentList";
export default IncidentList;
