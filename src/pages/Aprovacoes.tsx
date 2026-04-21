import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { ArrowLeft, CheckCircle2, XCircle, Clock, UserCheck, Loader2, Bell } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ApprovalDetailsDialog } from "@/components/ApprovalDetailsDialog";

interface PendingApproval {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  assigned_role: AppRole | null;
}

const ROLE_LABELS: Record<AppRole, string> = {
  coordenacao: "Coordenação",
  suporte: "Suporte",
  suporte_aluno: "Suporte ao Aluno",
};

export default function Aprovacoes() {
  const { role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, AppRole>>({});
  const [newCount, setNewCount] = useState(0);
  const [detailItem, setDetailItem] = useState<PendingApproval | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && role !== "coordenacao") {
      toast.error("Acesso restrito à Coordenação.");
      navigate("/", { replace: true });
    }
  }, [role, authLoading, navigate]);

  const fetchApprovals = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    const { data, error } = await supabase
      .from("pending_approvals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar solicitações.");
      if (!opts?.silent) setLoading(false);
      return;
    }
    const list = (data as PendingApproval[]) || [];
    setItems(list);
    if (!initializedRef.current) {
      list.forEach((i) => seenIdsRef.current.add(i.id));
      initializedRef.current = true;
    if (!opts?.silent) setLoading(false);
  };

  const revealNew = () => {
    setNewCount(0);
    setFilter("pending");
    items.forEach((i) => seenIdsRef.current.add(i.id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (role !== "coordenacao") return;
    fetchApprovals();

    const channel = supabase
      .channel("pending_approvals_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pending_approvals" },
        (payload) => {
          const row = payload.new as PendingApproval;
          if (row?.id && !seenIdsRef.current.has(row.id)) {
            setNewCount((c) => c + 1);
            toast.info(`Nova solicitação: ${row.display_name || row.email}`, {
              icon: "🔔",
            });
          }
          fetchApprovals({ silent: true });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "pending_approvals" },
        () => fetchApprovals({ silent: true })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role]);

  // Dynamic document title
  useEffect(() => {
    const base = "Aprovações de Acesso";
    document.title = newCount > 0 ? `(${newCount}) ${base}` : base;
    return () => {
      document.title = base;
    };
  }, [newCount]);

  const handleApprove = async (item: PendingApproval) => {
    const chosenRole = selectedRoles[item.id];
    if (!chosenRole) {
      toast.error("Selecione um papel antes de aprovar.");
      return;
    }
    setActioningId(item.id);
    const { error } = await supabase.rpc("approve_pending_user", {
      _user_id: item.user_id,
      _role: chosenRole,
    });
    setActioningId(null);
    if (error) {
      toast.error("Erro ao aprovar: " + error.message);
      return;
    }
    toast.success(`${item.display_name || item.email} aprovado como ${ROLE_LABELS[chosenRole]}.`);
    setDetailOpen(false);
    fetchApprovals({ silent: true });
  };

  const handleReject = async (item: PendingApproval) => {
    if (!confirm(`Rejeitar a solicitação de ${item.email}?`)) return;
    setActioningId(item.id);
    const { error } = await supabase.rpc("reject_pending_user", {
      _user_id: item.user_id,
    });
    setActioningId(null);
    if (error) {
      toast.error("Erro ao rejeitar: " + error.message);
      return;
    }
    toast.success("Solicitação rejeitada.");
    setDetailOpen(false);
    fetchApprovals({ silent: true });
  };

  const openDetails = (item: PendingApproval) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const filtered = items.filter((i) => filter === "all" || i.status === filter);
  const pendingCount = items.filter((i) => i.status === "pending").length;

  if (authLoading || role !== "coordenacao") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            <UserCheck className="w-5 h-5 text-primary" />
            Aprovações de Acesso
          </h1>
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 text-xs font-bold rounded-full bg-primary text-primary-foreground">
              {pendingCount}
            </span>
          )}
          {newCount > 0 && (
            <button
              onClick={revealNew}
              className="ml-auto flex items-center gap-1.5 px-3 h-8 text-xs font-semibold rounded-full bg-primary text-primary-foreground shadow-sm hover:brightness-110 transition-all animate-pulse"
              title="Ver novas solicitações"
            >
              <Bell className="w-3.5 h-3.5" />
              {newCount} {newCount === 1 ? "nova" : "novas"}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {newCount > 0 && (
          <button
            onClick={revealNew}
            className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary/10 border border-primary/30 text-primary font-medium text-sm hover:bg-primary/15 transition-colors"
          >
            <Bell className="w-4 h-4 animate-pulse" />
            {newCount} {newCount === 1 ? "nova solicitação chegou" : "novas solicitações chegaram"} — clique para ver
          </button>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {([
            { key: "pending", label: "Pendentes", icon: Clock },
            { key: "approved", label: "Aprovadas", icon: CheckCircle2 },
            { key: "rejected", label: "Rejeitadas", icon: XCircle },
            { key: "all", label: "Todas", icon: null },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                filter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma solicitação {filter !== "all" ? `${filter === "pending" ? "pendente" : filter === "approved" ? "aprovada" : "rejeitada"}` : ""}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openDetails(item)}
                className="w-full text-left bg-card border border-border rounded-lg p-4 sm:p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-foreground truncate">
                        {item.display_name || "Sem nome"}
                      </h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{item.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Solicitado em {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {item.status === "approved" && item.assigned_role && (
                      <p className="text-xs text-primary mt-1 font-medium">
                        Papel atribuído: {ROLE_LABELS[item.assigned_role]}
                      </p>
                    )}
                  </div>
                  {item.status === "pending" && (
                    <span className="text-xs font-medium text-primary self-start sm:self-center whitespace-nowrap">
                      Revisar →
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <ApprovalDetailsDialog
        item={detailItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        selectedRole={detailItem ? (selectedRoles[detailItem.id] || "") : ""}
        onSelectRole={(r) => {
          if (detailItem) setSelectedRoles((prev) => ({ ...prev, [detailItem.id]: r }));
        }}
        onApprove={() => detailItem && handleApprove(detailItem)}
        onReject={() => detailItem && handleReject(detailItem)}
        actioning={!!detailItem && actioningId === detailItem.id}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const cfg = {
    pending: { label: "Pendente", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" },
    approved: { label: "Aprovado", className: "bg-green-500/15 text-green-700 dark:text-green-400" },
    rejected: { label: "Rejeitado", className: "bg-destructive/15 text-destructive" },
  }[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
