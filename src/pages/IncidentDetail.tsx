import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Incident, ProblemType, UrgencyLevel } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Send, Trash2, Clock, User, Briefcase, AlertTriangle, FileText, Bell, CheckCircle, XCircle, MessageSquare, Camera, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ImageCarouselDialog from "@/components/ImageCarouselDialog";
import { generateSingleIncidentPDF } from "@/lib/report-pdf";

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
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4 animate-fade-in">
        <p className="text-muted-foreground text-lg">Incidente não encontrado.</p>
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
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" onClick={() => navigate("/")} className="shrink-0 hover-scale">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Detalhes do Incidente</h1>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover-scale shrink-0"
                  onClick={async () => {
                    toast.loading("Gerando PDF...", { id: "pdf" });
                    try {
                      await generateSingleIncidentPDF(incident);
                      toast.success("PDF gerado com sucesso!", { id: "pdf" });
                    } catch {
                      toast.error("Erro ao gerar PDF.", { id: "pdf" });
                    }
                  }}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Registrado em {format(incident.createdAt, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-3">
            <span className={`inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg ${urgencyStyles[incident.urgency]}`}>
              Urgência: {incident.urgency}
            </span>
            {incident.resolved ? (
              <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-urgency-low/15 text-urgency-low border border-urgency-low/30">
                <CheckCircle className="w-3.5 h-3.5" /> Resolvido
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-urgency-high/15 text-urgency-high border border-urgency-high/30">
                <XCircle className="w-3.5 h-3.5" /> Pendente
              </span>
            )}
            {incident.needsFollowUp && (
              <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-urgency-medium/15 text-urgency-medium border border-urgency-medium/30">
                <Bell className="w-3.5 h-3.5" /> Requer acompanhamento
              </span>
            )}
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ animationDelay: "0.05s" }}>
          <InfoCard icon={<User className="w-5 h-5 text-primary" />} label="Professor" value={incident.teacherName} delay={0} />
          <InfoCard icon={<Briefcase className="w-5 h-5 text-primary" />} label="Responsável" value={incident.coordinator} delay={1} />
          <InfoCard icon={<AlertTriangle className="w-5 h-5 text-primary" />} label="Tipo do Problema" value={incident.problemType} delay={2} />
          <InfoCard icon={<Clock className="w-5 h-5 text-primary" />} label="Data de Criação" value={format(incident.createdAt, "dd/MM/yyyy HH:mm", { locale: ptBR })} delay={3} />
        </div>

        {/* Description */}
        <section className="animate-fade-in" style={{ animationDelay: "0.15s", animationFillMode: "both" }}>
          <div className="bg-card rounded-xl shadow-card p-6 space-y-3">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              Descrição
            </h2>
            <p className="text-foreground whitespace-pre-wrap leading-relaxed pl-[42px]">{incident.description}</p>
          </div>
        </section>

        {/* Solution */}
        {incident.solution && (
          <section className="animate-fade-in" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
            <div className="bg-card rounded-xl shadow-card p-6 space-y-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-urgency-low/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-urgency-low" />
                </div>
                Solução
              </h2>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed pl-[42px]">{incident.solution}</p>
            </div>
          </section>
        )}

        {/* Images */}
        {incident.imageUrls.length > 0 && (
          <section className="animate-fade-in" style={{ animationDelay: "0.25s", animationFillMode: "both" }}>
            <div className="bg-card rounded-xl shadow-card p-6 space-y-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-primary" />
                </div>
                Imagens Anexadas
                <span className="ml-1 text-xs font-normal text-muted-foreground">({incident.imageUrls.length})</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pl-[42px]">
                {incident.imageUrls.map((url, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-xl border border-border cursor-pointer hover-scale"
                    onClick={() => setCarouselIndex(i)}
                    style={{ animationDelay: `${0.3 + i * 0.05}s`, animationFillMode: "both" }}
                  >
                    <img
                      src={url}
                      alt={`Anexo ${i + 1}`}
                      className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">Ampliar</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Comments */}
        <section className="animate-fade-in" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
          <div className="bg-card rounded-xl shadow-card p-6 space-y-5">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              Comentários
              <span className="ml-1 text-xs font-normal text-muted-foreground">({comments.length})</span>
            </h2>

            {comments.length === 0 && (
              <p className="text-sm text-muted-foreground pl-[42px]">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
            )}

            <div className="space-y-3 pl-[42px]">
              {comments.map((c, idx) => (
                <div
                  key={c.id}
                  className="bg-secondary/40 rounded-xl p-5 space-y-2 group relative border border-border/50 animate-fade-in"
                  style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: "both" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {c.author.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-foreground">{c.author}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(c.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-all duration-200"
                        title="Excluir comentário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed pl-9">{c.content}</p>
                </div>
              ))}
            </div>

            {/* New comment form */}
            <div className="border-t border-border pt-5 space-y-4 pl-[42px]">
              <h3 className="text-sm font-medium text-foreground">Adicionar comentário</h3>
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
                rows={4}
              />
              <Button onClick={handleSubmitComment} disabled={submitting} className="hover-scale">
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Enviando..." : "Enviar comentário"}
              </Button>
            </div>
          </div>
        </section>
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

function InfoCard({ icon, label, value, delay = 0 }: { icon: React.ReactNode; label: string; value: string; delay?: number }) {
  return (
    <div
      className="bg-card rounded-xl shadow-card p-5 flex items-start gap-4 hover-scale animate-fade-in"
      style={{ animationDelay: `${0.08 + delay * 0.05}s`, animationFillMode: "both" }}
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-base font-semibold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}
