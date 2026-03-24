import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Incident, ProblemType, UrgencyLevel } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Send, Trash2, Clock, User, Briefcase, AlertTriangle, FileText, Bell, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ImageCarouselDialog from "@/components/ImageCarouselDialog";

interface Comment {
  id: string;
  author: string;
  content: string;
  created_at: string;
}

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAuthor, setNewAuthor] = useState("");
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    const [incRes, comRes] = await Promise.all([
      supabase.from("incidents").select("*").eq("id", id!).single(),
      (supabase.from as any)("incident_comments").select("*").eq("incident_id", id!).order("created_at", { ascending: true }),
    ]);

    if (incRes.data) {
      const r = incRes.data;
      setIncident({
        id: r.id,
        teacherName: r.teacher_name,
        coordinator: r.coordinator,
        problemType: r.problem_type as ProblemType,
        urgency: r.urgency as UrgencyLevel,
        description: r.description,
        solution: r.solution || "",
        needsFollowUp: r.needs_follow_up,
        resolved: r.resolved,
        imageUrls: r.image_urls || [],
        createdAt: new Date(r.created_at),
      });
    }
    setComments(comRes.data || []);
    setLoading(false);
  }

  async function handleSubmitComment() {
    if (!newAuthor.trim() || !newComment.trim()) {
      toast.error("Preencha o autor e o comentário.");
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase.from as any)("incident_comments").insert({
      incident_id: id!,
      author: newAuthor.trim(),
      content: newComment.trim(),
    });
    if (error) {
      toast.error("Erro ao salvar comentário.");
    } else {
      toast.success("Comentário adicionado!");
      setNewComment("");
      await loadData();
    }
    setSubmitting(false);
  }

  async function handleDeleteComment(commentId: string) {
    if (!window.confirm("Deseja excluir este comentário?")) return;
    await (supabase.from as any)("incident_comments").delete().eq("id", commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    toast.success("Comentário excluído.");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4">
        <p className="text-muted-foreground">Incidente não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  const urgencyStyles: Record<UrgencyLevel, string> = {
    Alta: "bg-urgency-high/15 text-urgency-high border border-urgency-high/30",
    Média: "bg-urgency-medium/15 text-urgency-medium border border-urgency-medium/30",
    Baixa: "bg-urgency-low/15 text-urgency-low border border-urgency-low/30",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Detalhes do Incidente</h1>
            <p className="text-sm text-muted-foreground">
              Registrado em {format(incident.createdAt, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <span className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-md ${urgencyStyles[incident.urgency]}`}>
            {incident.urgency}
          </span>
          {incident.resolved ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-urgency-low/15 text-urgency-low border border-urgency-low/30">
              <CheckCircle className="w-3.5 h-3.5" /> Resolvido
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-urgency-high/15 text-urgency-high border border-urgency-high/30">
              <XCircle className="w-3.5 h-3.5" /> Pendente
            </span>
          )}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard icon={<User className="w-4 h-4 text-primary" />} label="Professor" value={incident.teacherName} />
          <InfoCard icon={<Briefcase className="w-4 h-4 text-primary" />} label="Responsável" value={incident.coordinator} />
          <InfoCard icon={<AlertTriangle className="w-4 h-4 text-primary" />} label="Tipo do Problema" value={incident.problemType} />
          <InfoCard icon={<Clock className="w-4 h-4 text-primary" />} label="Data de Criação" value={format(incident.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })} />
          {incident.needsFollowUp && (
            <div className="col-span-full">
              <InfoCard icon={<Bell className="w-4 h-4 text-urgency-medium" />} label="Acompanhamento" value="Este incidente requer acompanhamento" />
            </div>
          )}
        </div>

        {/* Description */}
        <div className="bg-card rounded-lg shadow-card p-5 space-y-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Descrição
          </h2>
          <p className="text-foreground whitespace-pre-wrap">{incident.description}</p>
        </div>

        {/* Solution */}
        {incident.solution && (
          <div className="bg-card rounded-lg shadow-card p-5 space-y-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-urgency-low" /> Solução
            </h2>
            <p className="text-foreground whitespace-pre-wrap">{incident.solution}</p>
          </div>
        )}

        {/* Images */}
        {incident.imageUrls.length > 0 && (
          <div className="bg-card rounded-lg shadow-card p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">📷 Imagens Anexadas ({incident.imageUrls.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {incident.imageUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Anexo ${i + 1}`}
                  className="w-full aspect-square object-cover rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setCarouselIndex(i)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="bg-card rounded-lg shadow-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">💬 Comentários ({comments.length})</h2>

          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
          )}

          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="bg-secondary/50 rounded-lg p-4 space-y-1 group relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{c.author}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(c.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-all"
                      title="Excluir comentário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
          </div>

          {/* New comment form */}
          <div className="border-t border-border pt-4 space-y-3">
            <Input
              placeholder="Seu nome *"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              className="max-w-xs"
            />
            <Textarea
              placeholder="Escreva um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <Button onClick={handleSubmitComment} disabled={submitting} size="sm">
              <Send className="w-4 h-4 mr-1" />
              {submitting ? "Enviando..." : "Enviar comentário"}
            </Button>
          </div>
        </div>
      </div>

      {carouselIndex !== null && (
        <ImageCarouselDialog
          images={incident.imageUrls}
          initialIndex={carouselIndex}
          onClose={() => setCarouselIndex(null)}
        />
      )}
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card rounded-lg shadow-card p-4 flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
