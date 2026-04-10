import { ChevronLeft, ChevronRight } from "lucide-react";

interface IncidentPaginationProps {
  filteredCount: number;
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function IncidentPagination({
  filteredCount, totalCount, pageSize, currentPage, totalPages, onPageChange, onPageSizeChange,
}: IncidentPaginationProps) {
  const safePage = Math.min(currentPage, totalPages);

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <p className="text-xs text-muted-foreground tabular-nums">
        {filteredCount} de {totalCount} registros
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Por página:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs bg-secondary text-foreground rounded-md px-2 py-1 border border-border cursor-pointer"
          >
            {[10, 25, 50, 0].map((n) => (
              <option key={n} value={n}>{n === 0 ? "Todos" : n}</option>
            ))}
          </select>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={safePage <= 1}
              className="px-1.5 py-1 text-xs rounded-md bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
            >
              «
            </button>
            <button
              onClick={() => onPageChange(Math.max(1, safePage - 1))}
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
                    onClick={() => onPageChange(p)}
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
              onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-md bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={safePage >= totalPages}
              className="px-1.5 py-1 text-xs rounded-md bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
            >
              »
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
