import { useState } from "react";
import { Link } from "react-router-dom";
import { Headset } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTeacherTracking, useTeachersDueAlerts } from "@/hooks/use-teacher-tracking";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function AcompanhamentoAlertsBell({ compact = false }: { compact?: boolean }) {
  // Subscribe to realtime via the hook
  useTeacherTracking();
  const due = useTeachersDueAlerts();
  const [open, setOpen] = useState(false);
  const count = due.length;

  const tip = count > 0 ? `Mensagens vencidas — ${count} professor(es)` : "Acompanhamento da Coordenação — sem pendências";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              aria-label={tip}
              className={`relative inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${
                compact ? "p-1.5" : "p-2"
              }`}
            >
              <Headset className="w-4 h-4" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[1rem] h-4 px-1 text-[10px] font-bold rounded-full bg-urgency-high text-white animate-pulse">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tip}</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-3 py-2 border-b border-border text-sm font-semibold">
          Acompanhamento — mensagens vencidas
        </div>
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
          {count === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-6">
              Nenhuma mensagem pendente.
            </div>
          ) : (
            due.map((t) => (
              <Link
                key={t.id}
                to="/acompanhamento-suporte"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-xs hover:bg-accent/30"
              >
                <div className="font-semibold truncate">{t.teacher_name}</div>
                <div className="text-muted-foreground">
                  {t.second_message_sent ? "2ª mensagem" : t.first_message_sent ? "1ª mensagem" : "Mensagem"} prevista para{" "}
                  <span className="text-urgency-high font-medium">
                    {t.next_message_due
                      ? format(new Date(t.next_message_due + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })
                      : "—"}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
