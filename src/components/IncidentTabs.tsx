import { Download, Sheet } from "lucide-react";

type TabKey = "active" | "resolved" | "interno" | "resolvedCI";

interface IncidentTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  activeCount: number;
  resolvedCount: number;
  internoCount: number;
  resolvedCICount: number;
  newResolvedCount: number;
  newResolvedCICount: number;
  canSeeInterno: boolean;
  canSeeProfessor: boolean;
  onClearResolvedBadge: () => void;
  onClearResolvedCIBadge: () => void;
  onExportExcel: () => void;
  onOpenSheets: () => void;
}

export default function IncidentTabs({
  activeTab, onTabChange,
  activeCount, resolvedCount, internoCount, resolvedCICount,
  newResolvedCount, newResolvedCICount,
  canSeeInterno, canSeeProfessor,
  onClearResolvedBadge, onClearResolvedCIBadge,
  onExportExcel, onOpenSheets,
}: IncidentTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
      <div className="inline-flex h-auto flex-wrap items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
        {canSeeProfessor && (
          <>
            <TabButton active={activeTab === "active"} onClick={() => onTabChange("active")}>
              <span className="hidden sm:inline">Registros Recentes</span>
              <span className="sm:hidden">Recentes</span>
              {" "}({activeCount})
            </TabButton>
            <TabButton
              active={activeTab === "resolved"}
              onClick={() => { onTabChange("resolved"); onClearResolvedBadge(); }}
              badge={newResolvedCount}
            >
              <span className="hidden sm:inline">Solucionados</span>
              <span className="sm:hidden">Solucion.</span>
              {" "}({resolvedCount})
            </TabButton>
          </>
        )}
        {canSeeInterno && (
          <>
            <TabButton active={activeTab === "interno"} onClick={() => onTabChange("interno")}>
              <span className="hidden sm:inline">Controle Interno</span>
              <span className="sm:hidden">Interno</span>
              {" "}({internoCount})
            </TabButton>
            <TabButton
              active={activeTab === "resolvedCI"}
              onClick={() => { onTabChange("resolvedCI"); onClearResolvedCIBadge(); }}
              badge={newResolvedCICount}
            >
              <span className="hidden sm:inline">Solucionados CI</span>
              <span className="sm:hidden">Sol. CI</span>
              {" "}({resolvedCICount})
            </TabButton>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSheets}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
        >
          <Sheet className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Google Sheets</span>
          <span className="sm:hidden">Sheets</span>
        </button>
        <button
          onClick={onExportExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar Excel</span>
          <span className="sm:hidden">Excel</span>
        </button>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, badge, children }: {
  active: boolean;
  onClick: () => void;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all relative ${
        active ? "bg-background text-foreground shadow-sm" : ""
      }`}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}
