import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Mail, User, Calendar, Shield, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppRole } from "@/contexts/AuthContext";

interface PendingApproval {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  approved_at: string | null;
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

          {/* Data de aprovação (se houver) */}
          {item.approved_at && (
            <DetailRow
              icon={Clock}
              label={item.status === "approved" ? "Aprovado em" : "Decidido em"}
              value={format(new Date(item.approved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            />
          )}

          {/* Papel atribuído (se aprovado) */}
          {item.status === "approved" && item.assigned_role && (
            <DetailRow icon={Shield} label="Papel atribuído" value={ROLE_LABELS[item.assigned_role]} highlight />
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
