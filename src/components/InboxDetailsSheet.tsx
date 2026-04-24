import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCircle2,
  Flag,
  Forward,
  Loader2,
  ExternalLink,
  Clock,
  User,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MentionInput, { SelectedRecipient } from "@/components/MentionInput";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  DelegationWithIncident,
  useMarkDelegationRead,
  createDelegations,
  INBOX_KEY,
  UNREAD_KEY,
} from "@/hooks/use-delegations";

const URGENCY_STYLES: Record<string, string> = {
  Alta: "bg-urgency-high-bg text-urgency-high border-urgency-high",
  Média: "bg-urgency-medium-bg text-urgency-medium border-urgency-medium",
  Baixa: "bg-urgency-low-bg text-urgency-low border-urgency-low",
};

interface Props {
  delegation: DelegationWithIncident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InboxDetailsSheet({ delegation, open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const markRead = useMarkDelegationRead();

  const [forwardOpen, setForwardOpen] = useState(false);
  const [recipients, setRecipients] = useState<SelectedRecipient[]>([]);
  const [confirmAction, setConfirmAction] = useState<null | "resolve" | "finish" | "forward">(null);

  // Reset estado ao trocar delegação
  useEffect(() => {
    setForwardOpen(false);
    setRecipients([]);
    setConfirmAction(null);
  }, [delegation?.id]);

  // Marca como lida ao abrir
  useEffect(() => {
    if (open && delegation && !delegation.is_read) {
      markRead.mutate(delegation.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, delegation?.id]);

  const inc = delegation?.incident;
  const isHigh = inc?.urgency === "Alta";

  // Resolver incidente (marca incidents.resolved = true)
  const resolveMutation = useMutation({
    mutationFn: async () => {
      if (!inc) throw new Error("Sem incidente");
      const { error } = await supabase
        .from("incidents")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", inc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Incidente resolvido", description: "O incidente foi marcado como resolvido." });
      queryClient.invalidateQueries({ queryKey: INBOX_KEY });
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      onOpenChange(false);
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao resolver", description: e.message, variant: "destructive" }),
  });

  // Finalizar = remover delegação da minha caixa (delete) — encerra a tarefa para mim
  const finishMutation = useMutation({
    mutationFn: async () => {
      if (!delegation) throw new Error("Sem delegação");
      const { error } = await supabase
        .from("incident_delegations")
        .delete()
        .eq("id", delegation.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Delegação finalizada", description: "Removida da sua caixa de entrada." });
      queryClient.invalidateQueries({ queryKey: INBOX_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
      onOpenChange(false);
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao finalizar", description: e.message, variant: "destructive" }),
  });

  // Encaminhar = criar novas delegações para outros usuários
  const forwardMutation = useMutation({
    mutationFn: async () => {
      if (!inc || !user || recipients.length === 0) return;
      await createDelegations(
        inc.id,
        user.id,
        recipients.map((r) => ({ user_id: r.user_id, display_name: r.display_name }))
      );
    },
    onSuccess: () => {
      toast({
        title: "Encaminhado",
        description: `Delegado para ${recipients.length} usuário(s).`,
      });
      setForwardOpen(false);
      setRecipients([]);
      queryClient.invalidateQueries({ queryKey: INBOX_KEY });
    },
    onError: (e: Error) =>
      toast({ title: "Erro ao encaminhar", description: e.message, variant: "destructive" }),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {!delegation || !inc ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {!delegation ? "Selecione uma delegação" : "Incidente não encontrado"}
          </div>
        ) : (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-start gap-2 flex-wrap">
                <SheetTitle className="text-base">{inc.teacherName}</SheetTitle>
                {isHigh ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded border border-urgency-high bg-urgency-high text-white">
                    <Flame className="w-3 h-3" />
                    Alta urgência
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border ${
                      URGENCY_STYLES[inc.urgency] || ""
                    }`}
                  >
                    {inc.urgency}
                  </span>
                )}
                {inc.resolved && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-green-500/15 text-green-700 dark:text-green-400">
                    <CheckCircle2 className="w-3 h-3" />
                    Resolvido
                  </span>
                )}
              </div>
              <SheetDescription className="flex items-center gap-3 text-xs flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {inc.coordinator}
                </span>
                <span className="inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {inc.problemType}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(inc.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </span>
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 space-y-4">
              <section>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                  Descrição
                </h4>
                <p className="text-sm text-foreground whitespace-pre-wrap">{inc.description}</p>
              </section>

              {inc.solution && (
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                    Solução
                  </h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{inc.solution}</p>
                </section>
              )}

              {inc.imageUrls.length > 0 && (
                <section>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
                    Anexos
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {inc.imageUrls.length} arquivo(s) anexado(s) — abra o incidente para visualizar.
                  </p>
                </section>
              )}

              <section className="text-[11px] text-muted-foreground bg-muted/30 rounded-md p-2">
                Delegado em {format(new Date(delegation.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                {delegation.is_read && delegation.read_at && (
                  <> · Lido em {format(new Date(delegation.read_at), "dd/MM HH:mm", { locale: ptBR })}</>
                )}
              </section>
            </div>

            <Separator className="my-5" />

            {/* Ações */}
            <div className="space-y-2">
              {!forwardOpen ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => setConfirmAction("resolve")}
                      disabled={resolveMutation.isPending || inc.resolved}
                      className="w-full"
                    >
                      {resolveMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      {inc.resolved ? "Já resolvido" : "Resolver"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setConfirmAction("finish")}
                      disabled={finishMutation.isPending}
                      className="w-full"
                    >
                      {finishMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Flag className="w-4 h-4" />
                      )}
                      Finalizar
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForwardOpen(true)}
                    className="w-full"
                  >
                    <Forward className="w-4 h-4" />
                    Encaminhar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(`/incidente/${inc.id}`)}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir página do incidente
                  </Button>
                </>
              ) : (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-xs font-medium text-foreground">
                    Encaminhar para
                  </label>
                  <MentionInput selected={recipients} onChange={setRecipients} />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => setConfirmAction("forward")}
                      disabled={recipients.length === 0 || forwardMutation.isPending}
                      className="flex-1"
                    >
                      {forwardMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Forward className="w-4 h-4" />
                      )}
                      Enviar ({recipients.length})
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setForwardOpen(false);
                        setRecipients([]);
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">
              <strong>Resolver</strong>: marca o incidente como resolvido para todos.{" "}
              <strong>Finalizar</strong>: remove apenas da sua caixa.{" "}
              <strong>Encaminhar</strong>: cria uma nova delegação para outros usuários.
            </p>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
