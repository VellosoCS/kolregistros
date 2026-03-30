import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface GoogleSheetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CSV_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/export-csv`;

export default function GoogleSheetsDialog({ open, onOpenChange }: GoogleSheetsDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const formula = `=IMPORTDATA("${CSV_URL}")`;
  const formulaResolved = `=IMPORTDATA("${CSV_URL}?resolved=true")`;
  const formulaActive = `=IMPORTDATA("${CSV_URL}?resolved=false")`;

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Conectar ao Google Sheets</DialogTitle>
          <DialogDescription>
            Use as fórmulas abaixo no Google Sheets para importar os dados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-foreground">📋 Todos os registros:</p>
            <div className="flex items-center gap-2 bg-muted rounded-md p-2">
              <code className="flex-1 text-xs break-all select-all">{formula}</code>
              <Button size="icon" variant="ghost" className="shrink-0 h-7 w-7" onClick={() => handleCopy(formula, "all")}>
                {copied === "all" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">🟡 Apenas ativos:</p>
            <div className="flex items-center gap-2 bg-muted rounded-md p-2">
              <code className="flex-1 text-xs break-all select-all">{formulaActive}</code>
              <Button size="icon" variant="ghost" className="shrink-0 h-7 w-7" onClick={() => handleCopy(formulaActive, "active")}>
                {copied === "active" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-foreground">✅ Apenas solucionados:</p>
            <div className="flex items-center gap-2 bg-muted rounded-md p-2">
              <code className="flex-1 text-xs break-all select-all">{formulaResolved}</code>
              <Button size="icon" variant="ghost" className="shrink-0 h-7 w-7" onClick={() => handleCopy(formulaResolved, "resolved")}>
                {copied === "resolved" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>

          <div className="bg-accent/50 rounded-md p-3 space-y-1.5">
            <p className="font-medium text-foreground">Como usar:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
              <li>Abra uma planilha no Google Sheets</li>
              <li>Selecione a célula A1</li>
              <li>Cole a fórmula desejada acima</li>
              <li>Os dados serão importados automaticamente</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              ⏱️ O Google Sheets atualiza os dados automaticamente a cada ~1 hora.
            </p>
          </div>

          <Button variant="outline" className="w-full" onClick={() => window.open("https://sheets.new", "_blank")}>
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Criar nova planilha no Google Sheets
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
