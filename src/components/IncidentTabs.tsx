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
    <div className="flex items-center justify-between mb-3">
      <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
        {canSeeProfessor && (
          <>
            <TabButton active={activeTab === "active"} onClick={() => onTabChange("active")}>
              Registros Recentes ({activeCount})
            </TabButton>
            <TabButton
              active={activeTab === "resolved"}
              onClick={() => { onTabChange("resolved"); onClearResolvedBadge(); }}
              badge={newResolvedCount}
            >
              Solucionados ({resolvedCount})
            </TabButton>
          </>
        )}
        {canSeeInterno && (
          <>
            <TabButton active={activeTab === "interno"} onClick={() => onTabChange("interno")}>
              Controle Interno ({internoCount})
            </TabButton>
            <TabButton
              active={activeTab === "resolvedCI"}
              onClick={() => { onTabChange("resolvedCI"); onClearResolvedCIBadge(); }}
              badge={newResolvedCICount}
            >
              Solucionados CI ({resolvedCICount})
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
          Google Sheets
        </button>
        <button
          onClick={onExportExcel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar Excel
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
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all relative ${
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
