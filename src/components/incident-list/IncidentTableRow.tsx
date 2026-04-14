import { Incident, UrgencyLevel } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, Trash2, Pencil, CheckCircle, Eye, Clock, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PROBLEM_ICONS } from "@/lib/constants";
import { isVideoUrl } from "@/lib/media-utils";
import { useNavigate } from "react-router-dom";
import CachedImage from "@/components/CachedImage";

const URGENCY_STYLES: Record<UrgencyLevel, string> = {
  Alta: "bg-urgency-high/15 text-urgency-high border border-urgency-high/30",
  Média: "bg-urgency-medium/15 text-urgency-medium border border-urgency-medium/30",
  Baixa: "bg-urgency-low/15 text-urgency-low border border-urgency-low/30",
};

interface IncidentTableRowProps {
  incident: Incident;
  signedImageUrls: string[];
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleResolved?: (id: string) => void;
  onEdit?: (incident: Incident) => void;
  onReport?: (incident: Incident) => void;
  onDelete?: (id: string) => void;
  onImageClick?: (urls: string[], startIndex: number) => void;
  onTextClick?: (title: string, content: string) => void;
  hideTeacher?: boolean;
}

export default function IncidentTableRow({
  incident, signedImageUrls, isSelected, onToggleSelect, onToggleResolved,
  onEdit, onReport, onDelete, onImageClick, onTextClick, hideTeacher = false,
}: IncidentTableRowProps) {
  const navigate = useNavigate();

  return (
    <>
      <td className="px-2 py-3 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(incident.id)}
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
        <span className={`inline-flex items-center justify-center w-16 px-2.5 py-1 text-xs font-semibold rounded-md ${URGENCY_STYLES[incident.urgency]}`}>
          {incident.urgency}
        </span>
      </td>
      {!hideTeacher && (
        <td className="px-4 py-3 text-center font-medium text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
          {incident.teacherName}
        </td>
      )}
      <td className="px-4 py-3 text-center text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
        {incident.coordinator}
      </td>
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
          onClick={() => onTextClick?.("Descrição", incident.description)}
        >
          {incident.description}
        </span>
      </td>
      <td className="px-4 py-3 text-center text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
        {incident.solution ? (
          <span
            className="block truncate cursor-pointer hover:text-primary transition-colors"
            title="Clique para ver completo"
            onClick={() => onTextClick?.("Solução", incident.solution)}
          >
            {incident.solution}
          </span>
        ) : "—"}
      </td>
      <td className="px-4 py-3 text-center overflow-hidden">
        {signedImageUrls.length > 0 ? (
          <div
            className="flex gap-1 justify-center items-center cursor-pointer flex-wrap max-w-full overflow-hidden"
            onClick={() => onImageClick?.(signedImageUrls, 0)}
          >
            {signedImageUrls.slice(0, 2).map((url, i) =>
              isVideoUrl(url) ? (
                <video key={i} src={url} className="w-7 h-7 min-w-0 shrink-0 object-cover rounded border border-border" muted preload="none" />
              ) : (
                <CachedImage key={i} src={url} alt={`Anexo ${i + 1}`} className="w-7 h-7 min-w-0 shrink-0 object-cover rounded border border-border" loading="lazy" />
              )
            )}
            {signedImageUrls.length > 2 && (
              <span className="text-xs text-muted-foreground shrink-0">+{signedImageUrls.length - 2}</span>
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
        <button onClick={() => onEdit?.(incident)} className="text-muted-foreground hover:text-foreground transition-colors" title="Editar incidente">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => onReport?.(incident)} className="text-primary hover:text-primary/80 transition-colors" title="Gerar relatório">
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
}
