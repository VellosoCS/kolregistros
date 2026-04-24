import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Inbox, CheckCheck, Loader2, Clock, AlertCircle, CheckCircle2, Flame } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useInboxDelegations,
  useDelegationsRealtime,
  useMarkAllDelegationsRead,
  DelegationWithIncident,
} from "@/hooks/use-delegations";
import { useAuth } from "@/contexts/AuthContext";
import InboxDetailsSheet from "@/components/InboxDetailsSheet";

type InboxFilter = "all" | "unread" | "done";

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
  const markAllRead = useMarkAllDelegationsRead();
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [selected, setSelected] = useState<DelegationWithIncident | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const unreadCount = delegations.filter((d) => !d.is_read).length;
  const doneCount = delegations.filter((d) => d.incident?.resolved).length;

  const URGENCY_ORDER: Record<string, number> = { Alta: 0, Média: 1, Baixa: 2 };

  const filteredDelegations = useMemo(() => {
    let list = delegations;
    if (filter === "unread") list = list.filter((d) => !d.is_read);
    else if (filter === "done") list = list.filter((d) => d.incident?.resolved);
    // Ordenação secundária por urgência (Alta → Média → Baixa), preservando ordem cronológica do hook
    return [...list].sort((a, b) => {
      const ua = URGENCY_ORDER[a.incident?.urgency ?? ""] ?? 99;
      const ub = URGENCY_ORDER[b.incident?.urgency ?? ""] ?? 99;
      if (ua !== ub) return ua - ub;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [delegations, filter]);

  const openDelegation = (d: DelegationWithIncident) => {
    setSelected(d);
    setSheetOpen(true);
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
        {/* Filtros rápidos */}
        {!isLoading && delegations.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {([
              { key: "all", label: "Todas", count: delegations.length },
              { key: "unread", label: "Não lidas", count: unreadCount },
              { key: "done", label: "Finalizadas", count: doneCount },
            ] as { key: InboxFilter; label: string; count: number }[]).map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
                  }`}
                >
                  {f.label}
                  <span
                    className={`inline-flex items-center justify-center min-w-[1.25rem] h-4 px-1 text-[10px] font-bold rounded-full ${
                      active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground"
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

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
        ) : filteredDelegations.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhuma delegação neste filtro</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredDelegations.map((d) => {
              const inc = d.incident;
              const created = new Date(d.created_at);
              const isHighUrgency = inc?.urgency === "Alta";
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => inc && openDelegation(d)}
                    disabled={!inc}
                    className={`w-full text-left p-4 rounded-lg border shadow-sm transition-all relative ${
                      isHighUrgency
                        ? "bg-urgency-high-bg/40 border-urgency-high border-l-4 hover:border-urgency-high"
                        : d.is_read
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
                          {isHighUrgency ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded border border-urgency-high bg-urgency-high text-white shadow-sm animate-pulse">
                              <Flame className="w-3 h-3" />
                              Alta urgência
                            </span>
                          ) : (
                            inc && (
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${
                                  URGENCY_STYLES[inc.urgency] || ""
                                }`}
                              >
                                {inc.urgency}
                              </span>
                            )
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

      <InboxDetailsSheet
        delegation={selected}
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) setSelected(null);
        }}
      />
    </div>
  );
}
