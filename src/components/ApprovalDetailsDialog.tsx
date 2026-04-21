import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail, User, Calendar, Shield, FileClock, UserCheck, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/contexts/AuthContext";

type AuditEntry = {
  id: string;
  previous_status: "pending" | "approved" | "rejected" | null;
  new_status: "pending" | "approved" | "rejected";
  assigned_role: AppRole | null;
  performed_by_name: string | null;
  created_at: string;
};

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

interface Props {
  item: PendingApproval | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRole: AppRole | "";
  onSelectRole: (role: AppRole) => void;
  onApprove: () => void;
  onReject: () => void;
  actioning: boolean;
}

export function ApprovalDetailsDialog({
  item,
  open,
  onOpenChange,
  selectedRole,
  onSelectRole,
  onApprove,
  onReject,
  actioning,
}: Props) {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    let cancelled = false;

    const fetchAudit = async () => {
      setAuditLoading(true);
      const { data } = await supabase
        .from("approval_audit_log")
        .select("id, previous_status, new_status, assigned_role, performed_by_name, created_at")
        .eq("pending_approval_id", item.id)
        .order("created_at", { ascending: true });
      if (!cancelled) {
        setAuditEntries((data as AuditEntry[]) || []);
        setAuditLoading(false);
      }
    };

    fetchAudit();

    // Realtime: refetch on new audit entries for this approval
    const channel = supabase
      .channel(`audit_log_${item.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "approval_audit_log",
          filter: `pending_approval_id=eq.${item.id}`,
        },
        () => fetchAudit()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [open, item?.id]);

  if (!item) return null;

  const statusCfg = {
    pending: { label: "Pendente", className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400" },
    approved: { label: "Aprovado", className: "bg-green-500/15 text-green-700 dark:text-green-400" },
    rejected: { label: "Rejeitado", className: "bg-destructive/15 text-destructive" },
  }[item.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Detalhes da Solicitação
          </DialogTitle>
          <DialogDescription>
            Revise os dados antes de aprovar ou rejeitar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
          </div>

          <div className="border-t border-border" />

          {/* Nome */}
          <DetailRow icon={User} label="Nome" value={item.display_name || "Sem nome"} />

          {/* Email */}
          <DetailRow icon={Mail} label="Email" value={item.email} mono />

          {/* Data de solicitação */}
          <DetailRow
            icon={Calendar}
            label="Solicitado em"
            value={format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          />

          {/* Papel atribuído (se aprovado) */}
          {item.status === "approved" && item.assigned_role && (
            <DetailRow icon={Shield} label="Papel atribuído" value={ROLE_LABELS[item.assigned_role]} highlight />
          )}

          {/* Audit Log */}
          {item.status !== "pending" && (
            <>
              <div className="border-t border-border" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileClock className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Log de Auditoria
                  </h4>
                </div>
                <ol className="relative border-l border-border ml-1.5 space-y-3">
                  {/* Solicitação criada */}
                  <li className="ml-4">
                    <span className="absolute -left-[5px] mt-1 h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
                    <p className="text-xs font-medium text-foreground">Solicitação criada</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      por {item.display_name || item.email}
                    </p>
                  </li>

                  {/* Decisão */}
                  {item.approved_at && (
                    <li className="ml-4">
                      <span
                        className={`absolute -left-[5px] mt-1 h-2.5 w-2.5 rounded-full ${
                          item.status === "approved" ? "bg-green-500" : "bg-destructive"
                        }`}
                      />
                      <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                        {item.status === "approved" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                            Aprovada
                            {item.assigned_role && (
                              <span className="text-muted-foreground font-normal">
                                como {ROLE_LABELS[item.assigned_role]}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-destructive" />
                            Rejeitada
                          </>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(item.approved_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        por {approverName || "Coordenação"}
                      </p>
                    </li>
                  )}
                </ol>
              </div>
            </>
          )}

          {/* Ações para pendentes */}
          {item.status === "pending" && (
            <>
              <div className="border-t border-border" />
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Atribuir papel
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => onSelectRole(e.target.value as AppRole)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={actioning}
                >
                  <option value="">Escolher papel...</option>
                  <option value="coordenacao">Coordenação</option>
                  <option value="suporte">Suporte</option>
                  <option value="suporte_aluno">Suporte ao Aluno</option>
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={onReject}
                  disabled={actioning}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                >
                  <XCircle className="w-4 h-4" />
                  Rejeitar
                </Button>
                <Button onClick={onApprove} disabled={actioning || !selectedRole}>
                  {actioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Aprovar
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p
          className={`text-sm break-words ${mono ? "font-mono" : ""} ${
            highlight ? "text-primary font-semibold" : "text-foreground"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
