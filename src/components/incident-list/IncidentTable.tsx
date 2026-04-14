import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Incident } from "@/lib/types";
import { Bell, CheckCircle, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ResizableTh from "./ResizableTh";
import IncidentTableRow from "./IncidentTableRow";
import { useBatchSignedUrls } from "@/hooks/use-batch-signed-urls";

interface IncidentTableProps {
  items: Incident[];
  filteredCount: number;
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  useServerSide: boolean;
  hideTeacher: boolean;
  selectedIds: Set<string>;
  allPageSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onToggleResolved?: (id: string) => void;
  onEdit: (incident: Incident) => void;
  onReport: (incident: Incident) => void;
  onDelete?: (id: string) => void;
  onImageClick: (urls: string[], idx: number) => void;
  onTextClick: (title: string, content: string) => void;
}

export default function IncidentTable({
  items, filteredCount, totalCount,
  isLoading, isError, useServerSide, hideTeacher,
  selectedIds, allPageSelected, onToggleSelect, onToggleSelectAll,
  onToggleResolved, onEdit, onReport, onDelete,
  onImageClick, onTextClick,
}: IncidentTableProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = 48;
  const useVirtual = items.length > 50;

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  // Batch resolve all signed URLs for the current page in a single API call
  const signedUrlsMap = useBatchSignedUrls(items);

  const colSpan = hideTeacher ? 11 : 12;

  return (
    <>
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
                  onChange={onToggleSelectAll}
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
            {isLoading && useServerSide ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td colSpan={colSpan} className="px-4 py-3">
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ))
            ) : isError && useServerSide ? (
              <tr>
                <td colSpan={colSpan} className="text-center text-destructive py-12">
                  Erro ao carregar registros. Tente recarregar a página.
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="text-center text-muted-foreground py-12">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : useVirtual ? (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const incident = items[virtualRow.index];
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
                      signedImageUrls={signedUrlsMap.get(incident.id) ?? incident.imageUrls ?? []}
                      isSelected={selectedIds.has(incident.id)}
                      onToggleSelect={onToggleSelect}
                      onToggleResolved={onToggleResolved}
                      onEdit={onEdit}
                      onReport={onReport}
                      onDelete={onDelete}
                      onImageClick={onImageClick}
                      onTextClick={onTextClick}
                      hideTeacher={hideTeacher}
                    />
                  </tr>
                );
              })
            ) : (
              items.map((incident) => (
                <tr
                  key={incident.id}
                  className={`border-b border-border last:border-0 hover:bg-accent/50 transition-colors animate-slide-in ${incident.resolved ? "bg-urgency-low/5" : "bg-urgency-medium/5"}`}
                >
                  <IncidentTableRow
                    incident={incident}
                    signedImageUrls={signedUrlsMap.get(incident.id) ?? incident.imageUrls ?? []}
                    isSelected={selectedIds.has(incident.id)}
                    onToggleSelect={onToggleSelect}
                    onToggleResolved={onToggleResolved}
                    onEdit={onEdit}
                    onReport={onReport}
                    onDelete={onDelete}
                    onImageClick={onImageClick}
                    onTextClick={onTextClick}
                    hideTeacher={hideTeacher}
                  />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
