import { useState, useEffect } from "react";
import { Incident } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ClipboardCopy, Check, X, FileText, Loader2 } from "lucide-react";
import { isVideoUrl } from "@/lib/media-utils";
import { getSignedImageUrls } from "@/lib/storage-utils";

interface IncidentReportDialogProps {
  incident: Incident;
  onClose: () => void;
}

const LONG_EXPIRY = 604800; // 7 days

function generateReport(incident: Incident, resolvedUrls: string[]): string {
  const date = format(incident.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const followUp = incident.needsFollowUp ? "Sim ⚠️" : "Não";

  let mediaSection = "";
  if (resolvedUrls.length > 0) {
    const mediaItems = resolvedUrls.map((url, i) => {
      if (isVideoUrl(url)) {
        return `[b]Vídeo ${i + 1}:[/b] [url=${url}]Assistir vídeo[/url]`;
      }
      return `[img size=medium]${url} [/img]`;
    });
    mediaSection = `\n[b]Mídias anexadas:[/b]\n${mediaItems.join("\n")}\n`;
  }

  return `[b][size=20]📋 RELATÓRIO DE INCIDENTE[/size][/b]
------

[b]🆔 ID:[/b] ${incident.id.slice(0, 8)}
[b]📅 Data:[/b] ${date}
[b]🚨 Urgência:[/b] ${incident.urgency}
[b]👤 Professor:[/b] ${incident.teacherName}
[b]🧑‍💼 Responsável:[/b] ${incident.coordinator}
[b]📂 Tipo:[/b] ${incident.problemType}

[b]📝 Descrição:[/b]
${incident.description}

[b]🔧 Solução aplicada:[/b]
${incident.solution || "Nenhuma registrada"}

[b]🔔 Acompanhamento:[/b] ${followUp}
${mediaSection}
------
[i]KoL - Registro de Incidentes[/i]`;
}

export default function IncidentReportDialog({ incident, onClose }: IncidentReportDialogProps) {
  const [copied, setCopied] = useState(false);
  const [resolvedUrls, setResolvedUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      if (!incident.imageUrls?.length) {
        setResolvedUrls([]);
        setLoading(false);
        return;
      }
      try {
        const urls = await getSignedImageUrls(incident.imageUrls);
        if (!cancelled) setResolvedUrls(urls);
      } catch {
        if (!cancelled) setResolvedUrls(incident.imageUrls ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    resolve();
    return () => { cancelled = true; };
  }, [incident.imageUrls]);

  const report = generateReport(incident, resolvedUrls);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[80vh] flex flex-col animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Relatório para Bitrix24</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Gerando URLs das mídias…</span>
            </div>
          ) : (
            <pre className="text-xs text-foreground whitespace-pre-wrap font-mono bg-secondary rounded-lg p-4 leading-relaxed">
              {report}
            </pre>
          )}
        </div>

        <div className="px-5 py-4 border-t border-border">
          <button
            onClick={handleCopy}
            disabled={loading}
            className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground shadow-primary-glow hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {copied ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
            {copied ? "Copiado!" : "Copiar para Bitrix24"}
          </button>
        </div>
      </div>
    </div>
  );
}
