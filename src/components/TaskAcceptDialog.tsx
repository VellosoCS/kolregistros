import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Flame,
  Loader2,
  User as UserIcon,
  UserCheck,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CachedImage from "@/components/CachedImage";
import { cn } from "@/lib/utils";
import {
  DelegationWithIncident,
  useUpdateTaskStatus,
} from "@/hooks/use-delegations";
import { useBatchSignedUrls } from "@/hooks/use-batch-signed-urls";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: DelegationWithIncident | null;
}

const URGENCY_STYLES: Record<string, { wrap: string; icon: JSX.Element; label: string }> = {
  Alta: {
    wrap: "border-urgency-high/40 bg-urgency-high/10 text-urgency-high",
    icon: <Flame className="w-3.5 h-3.5" />,
    label: "Alta",
  },
  Média: {
    wrap: "border-urgency-medium/40 bg-urgency-medium/10 text-urgency-medium",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: "Média",
  },
  Baixa: {
    wrap: "border-urgency-low/40 bg-urgency-low/10 text-urgency-low",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: "Baixa",
  },
};

export default function TaskAcceptDialog({ open, onOpenChange, task }: Props) {
  const updateStatus = useUpdateTaskStatus();
  const inc = task?.incident ?? null;

  const incidentForSign = useMemo(
    () => (inc && inc.imageUrls.length > 0 ? [{ id: inc.id, imageUrls: inc.imageUrls }] : []),
    [inc]
  );
  const signedMap = useBatchSignedUrls(incidentForSign);
  const images = inc ? signedMap.get(inc.id) ?? [] : [];

  if (!task) return null;

  const urgency = inc ? URGENCY_STYLES[inc.urgency] ?? URGENCY_STYLES.Baixa : URGENCY_STYLES.Baixa;

  const handleAccept = async () => {
    try {
      await updateStatus.mutateAsync({ id: task.id, status: "accepted" });
      toast.success("Tarefa aceita");
      onOpenChange(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao aceitar tarefa";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded border",
                urgency.wrap
              )}
            >
              {urgency.icon}
              {urgency.label}
            </span>
            {inc && (
              <Badge variant="outline" className="text-[11px]">
                {inc.incidentMode === "interno" ? "Controle Interno" : "Suporte"}
              </Badge>
            )}
            <Badge variant="secondary" className="text-[11px]">
              Pendente de aceitação
            </Badge>
          </div>
          <DialogTitle className="text-xl mt-2">
            {inc?.problemType ?? "Nova tarefa"}
          </DialogTitle>
          <DialogDescription>
            Confira os detalhes do incidente e aceite a tarefa para incluí-la em
            "Minhas Tarefas".
          </DialogDescription>
        </DialogHeader>

        {inc ? (
          <div className="space-y-4">
            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <MetaItem
                icon={<UserIcon className="w-3.5 h-3.5" />}
                label="Professor"
                value={inc.teacherName}
              />
              <MetaItem
                icon={<UserCheck className="w-3.5 h-3.5" />}
                label="Responsável"
                value={inc.coordinator}
              />
              <MetaItem
                icon={<UserCheck className="w-3.5 h-3.5" />}
                label="Delegado por"
                value={task.delegated_by_name ?? "—"}
              />
              <MetaItem
                icon={<CalendarDays className="w-3.5 h-3.5" />}
                label="Criado em"
                value={format(inc.createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              />
              {task.due_date && (
                <MetaItem
                  icon={<CalendarDays className="w-3.5 h-3.5 text-urgency-high" />}
                  label="Prazo"
                  value={format(new Date(task.due_date + "T00:00:00"), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                  highlight
                />
              )}
            </div>

            {/* Description */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1.5">
                Descrição
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {inc.description || "—"}
              </p>
            </div>

            {/* Solution */}
            {inc.solution && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5">
                  Solução proposta / aplicada
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {inc.solution}
                </p>
              </div>
            )}

            {/* Media */}
            {images.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5">
                  Mídias ({images.length})
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {images.slice(0, 8).map((src, i) => (
                    <CachedImage
                      key={i}
                      src={src}
                      alt={`Mídia ${i + 1}`}
                      className="w-full h-20 object-cover rounded-md border border-border"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Incidente não encontrado.
          </div>
        )}

        <DialogFooter className="gap-2 flex-wrap">
          {inc && (
            <Button asChild variant="outline" size="sm">
              <Link to={`/incidente/${inc.id}`}>
                <ExternalLink className="w-3.5 h-3.5" />
                Ver incidente completo
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="w-3.5 h-3.5" />
            Depois
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={updateStatus.isPending}
            className="bg-primary text-primary-foreground hover:brightness-110"
          >
            {updateStatus.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            Aceitar tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MetaItem({
  icon,
  label,
  value,
  highlight,
}: {
  icon: JSX.Element;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={cn("text-sm truncate", highlight && "font-semibold text-urgency-high")}>
        {value}
      </div>
    </div>
  );
}
