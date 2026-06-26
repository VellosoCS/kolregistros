import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Check, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useMesAnaliseAlerts,
  useUnreadMesAnaliseAlertsCount,
  useMesAnaliseAlertsRealtime,
  useMarkAlertRead,
  useMarkAllAlertsRead,
  type MesAnaliseAlert,
} from "@/hooks/use-mes-analise-alerts";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const LEVEL_BADGE: Record<MesAnaliseAlert["level"], { label: string; cls: string }> = {
  critico: { label: "Crítico", cls: "bg-urgency-high/15 text-urgency-high" },
  alerta: { label: "Alerta", cls: "bg-urgency-medium/15 text-urgency-medium" },
  observacao: { label: "Observação", cls: "bg-urgency-low/15 text-urgency-low" },
};

export default function MesAnaliseAlertsBell({ compact = false }: { compact?: boolean }) {
  useMesAnaliseAlertsRealtime();
  const { data: alerts = [] } = useMesAnaliseAlerts();
  const unread = useUnreadMesAnaliseAlertsCount();
  const markRead = useMarkAlertRead();
  const markAll = useMarkAllAlertsRead();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          title={unread > 0 ? `${unread} alerta(s) Mês de Análise` : "Alertas Mês de Análise"}
          className={`relative inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${
            compact ? "p-1.5" : "p-2"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[1rem] h-4 px-1 text-[10px] font-bold rounded-full bg-urgency-high text-white animate-pulse">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <div className="text-sm font-semibold">Alertas Mês de Análise</div>
          {unread > 0 && (
            <button
              onClick={() => markAll.mutate()}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Marcar todos como lidos
            </button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
          {alerts.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-6">
              Nenhum alerta no momento.
            </div>
          ) : (
            alerts.map((a) => {
              const meta = LEVEL_BADGE[a.level];
              return (
                <div
                  key={a.id}
                  className={`px-3 py-2 text-xs space-y-1 ${
                    a.is_read ? "opacity-60" : "bg-accent/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${meta.cls}`}>
                        {meta.label}
                      </span>
                      <span className="font-semibold truncate">{a.canonical_name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                      {format(new Date(a.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {a.total_count} incidentes negativos ·{" "}
                    {a.breakdown.map((b) => `${b.type} ×${b.count}`).join(", ")}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      to="/relatorios"
                      onClick={() => setOpen(false)}
                      className="text-primary hover:underline"
                    >
                      Ver sugestão →
                    </Link>
                    {!a.is_read && (
                      <button
                        onClick={() => markRead.mutate(a.id)}
                        className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" /> marcar lido
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
