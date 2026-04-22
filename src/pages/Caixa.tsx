import { useNavigate } from "react-router-dom";
import { ArrowLeft, Inbox, CheckCheck, Loader2, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useInboxDelegations,
  useDelegationsRealtime,
  useMarkDelegationRead,
  useMarkAllDelegationsRead,
} from "@/hooks/use-delegations";
import { useAuth } from "@/contexts/AuthContext";

const URGENCY_STYLES: Record<string, string> = {
  Alta: "bg-urgency-high-bg text-urgency-high border-urgency-high",
  Média: "bg-urgency-medium-bg text-urgency-medium border-urgency-medium",
  Baixa: "bg-urgency-low-bg text-urgency-low border-urgency-low",
};

export default function Caixa() {
  const navigate = useNavigate();
  const { user, profileName } = useAuth();
  useDelegationsRealtime();
  const { data: delegations = [], isLoading } = useInboxDelegations();
  const markRead = useMarkDelegationRead();
  const markAllRead = useMarkAllDelegationsRead();

  const unreadCount = delegations.filter((d) => !d.is_read).length;

  const openIncident = (delegationId: string, incidentId: string, isRead: boolean) => {
    if (!isRead) markRead.mutate(delegationId);
    navigate(`/incidente/${incidentId}`);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-2 py-1.5 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            Caixa de Entrada
          </h1>
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 text-xs font-bold rounded-full bg-primary text-primary-foreground">
              {unreadCount}
            </span>
          )}
          <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">
            {profileName}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas lidas
            </button>
          )}
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : delegations.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhum incidente delegado a você</p>
            <p className="text-xs mt-1">
              Quando alguém te delegar um incidente usando @{profileName ? profileName.toLowerCase().replace(/\s+/g, "") : "seunome"}, ele aparecerá aqui.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {delegations.map((d) => {
              const inc = d.incident;
              const created = new Date(d.created_at);
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => inc && openIncident(d.id, inc.id, d.is_read)}
                    disabled={!inc}
                    className={`w-full text-left p-4 rounded-lg border shadow-sm transition-all ${
                      d.is_read
                        ? "bg-card border-border hover:border-primary/30"
                        : "bg-primary/5 border-primary/30 hover:border-primary/50"
                    } ${!inc ? "opacity-60 cursor-not-allowed" : "hover:shadow-md"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {!d.is_read && (
                            <span className="inline-block w-2 h-2 rounded-full bg-primary" aria-label="Não lida" />
                          )}
                          <h3 className="font-semibold text-foreground truncate">
                            {inc ? inc.teacherName : "Incidente removido"}
                          </h3>
                          {inc && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${
                                URGENCY_STYLES[inc.urgency] || ""
                              }`}
                            >
                              {inc.urgency}
                            </span>
                          )}
                          {inc?.resolved && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-500/15 text-green-700 dark:text-green-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Resolvido
                            </span>
                          )}
                        </div>
                        {inc && (
                          <>
                            <p className="text-xs text-muted-foreground mb-1">
                              <span className="font-medium">{inc.problemType}</span> · {inc.coordinator}
                            </p>
                            <p className="text-sm text-foreground/80 line-clamp-2">{inc.description}</p>
                          </>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Delegado {formatDistanceToNow(created, { addSuffix: true, locale: ptBR })}
                          <span className="opacity-60">· {format(created, "dd/MM HH:mm", { locale: ptBR })}</span>
                        </p>
                      </div>
                      {!inc && (
                        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
