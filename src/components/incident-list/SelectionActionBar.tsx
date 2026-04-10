import { Download, X } from "lucide-react";

interface SelectionActionBarProps {
  count: number;
  onExportPDF: () => void;
  onExportDOCX: () => void;
  onClear: () => void;
}

export default function SelectionActionBar({ count, onExportPDF, onExportDOCX, onClear }: SelectionActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-xl shadow-lg px-5 py-3 flex items-center gap-4 animate-slide-up">
      <span className="text-sm font-medium text-foreground tabular-nums">
        {count} selecionado(s)
      </span>
      <button
        onClick={onExportPDF}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
      >
        <Download className="w-4 h-4" />
        PDF
      </button>
      <button
        onClick={onExportDOCX}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
      >
        <Download className="w-4 h-4" />
        Word
      </button>
      <button
        onClick={onClear}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        title="Limpar seleção"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
