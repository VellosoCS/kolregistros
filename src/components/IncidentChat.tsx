import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useApprovedUsers, nameToHandle, ApprovedUser } from "@/hooks/use-approved-users";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Trash2, MessageSquare, AtSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Comment {
  id: string;
  author: string;
  content: string;
  created_at: string;
}

const ROLE_LABELS: Record<ApprovedUser["role"], string> = {
  coordenacao: "Coordenação",
  suporte: "Suporte",
  suporte_aluno: "Suporte ao Aluno",
};

interface Props {
  incidentId: string;
}

export default function IncidentChat({ incidentId }: Props) {
  const { profileName } = useAuth();
  const { data: users = [] } = useApprovedUsers();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const myHandle = useMemo(() => nameToHandle(profileName, null), [profileName]);

  // Build candidates: real users + role groups
  type Candidate =
    | { kind: "user"; handle: string; label: string; sub?: string }
    | { kind: "role"; handle: string; label: string; sub?: string };

  const allCandidates: Candidate[] = useMemo(() => {
    const u: Candidate[] = users.map((u) => ({
      kind: "user" as const,
      handle: nameToHandle(u.display_name, u.email),
      label: u.display_name || u.email || "Usuário",
      sub: ROLE_LABELS[u.role],
    }));
    const groups: Candidate[] = [
      { kind: "role", handle: "coordenacao", label: "Coordenação", sub: "Setor" },
      { kind: "role", handle: "suporte", label: "Suporte", sub: "Setor" },
      { kind: "role", handle: "suporte_aluno", label: "Suporte ao Aluno", sub: "Setor" },
    ];
    return [...groups, ...u];
  }, [users]);

  const filteredCandidates = useMemo(() => {
    const q = mentionQuery.toLowerCase();
    return allCandidates
      .filter((c) => !q || c.handle.includes(q) || c.label.toLowerCase().includes(q))
      .slice(0, 6);
  }, [allCandidates, mentionQuery]);

  // Load + realtime subscription
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("incident_comments")
        .select("*")
        .eq("incident_id", incidentId)
        .order("created_at", { ascending: true });
      if (active) setComments(data || []);
    })();

    const channel = supabase
      .channel(`incident-chat-${incidentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incident_comments", filter: `incident_id=eq.${incidentId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setComments((prev) => {
              if (prev.some((c) => c.id === (payload.new as Comment).id)) return prev;
              return [...prev, payload.new as Comment];
            });
          } else if (payload.eventType === "DELETE") {
            setComments((prev) => prev.filter((c) => c.id !== (payload.old as Comment).id));
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [incidentId]);

  // Autoscroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length]);

  function onTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setNewComment(value);
    const caret = e.target.selectionStart ?? value.length;
    // Find last "@" before caret
    const upto = value.slice(0, caret);
    const at = upto.lastIndexOf("@");
    if (at >= 0 && (at === 0 || /\s/.test(upto[at - 1]))) {
      const token = upto.slice(at + 1);
      if (!/\s/.test(token)) {
        setMentionOpen(true);
        setMentionQuery(token.toLowerCase());
        setMentionStart(at);
        setActiveIdx(0);
        return;
      }
    }
    setMentionOpen(false);
  }

  function insertMention(c: Candidate) {
    const before = newComment.slice(0, mentionStart);
    const after = newComment.slice(textareaRef.current?.selectionStart ?? newComment.length);
    const inserted = `@${c.handle} `;
    const next = before + inserted + after;
    setNewComment(next);
    setMentionOpen(false);
    setTimeout(() => {
      textareaRef.current?.focus();
      const pos = before.length + inserted.length;
      textareaRef.current?.setSelectionRange(pos, pos);
    }, 0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionOpen && filteredCandidates.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, filteredCandidates.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredCandidates[activeIdx]);
        return;
      }
      if (e.key === "Escape") {
        setMentionOpen(false);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  async function handleSubmit() {
    const content = newComment.trim();
    if (!content) return;
    setSubmitting(true);
    const { error } = await supabase.from("incident_comments").insert({
      incident_id: incidentId,
      author: profileName || "Anônimo",
      content,
    });
    if (error) {
      toast.error("Erro ao enviar mensagem.");
    } else {
      setNewComment("");
    }
    setSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("Excluir esta mensagem?")) return;
    const { error } = await supabase.from("incident_comments").delete().eq("id", commentId);
    if (error) toast.error("Erro ao excluir.");
  }

  const validHandles = useMemo(() => {
    const set = new Set<string>();
    allCandidates.forEach((c) => set.add(c.handle));
    return set;
  }, [allCandidates]);

  function renderContent(text: string) {
    // Split by @handle tokens
    const parts = text.split(/(@[a-z0-9_]+)/gi);
    return parts.map((p, i) => {
      if (p.startsWith("@")) {
        const handle = p.slice(1).toLowerCase();
        if (validHandles.has(handle)) {
          return (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary/15 text-primary font-medium text-[0.92em]"
            >
              {p}
            </span>
          );
        }
      }
      return <span key={i}>{p}</span>;
    });
  }

  return (
    <section className="animate-fade-in" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
      <div className="bg-card rounded-xl shadow-card p-4 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          Chat do incidente
          <span className="ml-1 text-xs font-normal text-muted-foreground">({comments.length})</span>
        </h2>

        <div
          ref={scrollRef}
          className="max-h-[420px] overflow-y-auto rounded-lg bg-secondary/20 border border-border/40 p-3 sm:p-4 space-y-3"
        >
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma mensagem ainda. Inicie a conversa — use @ para mencionar alguém ou um setor.
            </p>
          )}
          {comments.map((c) => {
            const isMine = nameToHandle(c.author, null) === myHandle;
            return (
              <div key={c.id} className={`flex ${isMine ? "justify-end" : "justify-start"} group`}>
                <div className={`flex gap-2 max-w-[85%] ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isMine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    {c.author.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className={`flex items-center gap-2 text-xs ${isMine ? "justify-end" : "justify-start"}`}>
                      <span className="font-semibold text-foreground">{c.author}</span>
                      <span className="text-muted-foreground">
                        {format(new Date(c.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div
                      className={`relative rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-card border border-border rounded-tl-sm text-foreground"
                      }`}
                    >
                      {renderContent(c.content)}
                      {isMine && (
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-1 shadow"
                          title="Excluir"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AtSign className="w-3.5 h-3.5" />
            Digite <span className="font-mono">@</span> para mencionar uma pessoa ou setor — você está como{" "}
            <span className="font-medium text-foreground">{profileName || "Anônimo"}</span>
          </div>
          <Textarea
            ref={textareaRef}
            placeholder="Escreva uma mensagem... (Enter envia, Shift+Enter quebra linha)"
            value={newComment}
            onChange={onTextChange}
            onKeyDown={onKeyDown}
            rows={3}
            className="resize-none"
          />
          {mentionOpen && filteredCandidates.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-72 max-w-[90vw] bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-10">
              {filteredCandidates.map((c, i) => (
                <button
                  key={`${c.kind}-${c.handle}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertMention(c);
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm ${
                    i === activeIdx ? "bg-accent" : "hover:bg-accent/60"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      c.kind === "role" ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"
                    }`}
                  >
                    {c.kind === "role" ? "#" : c.label.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium text-foreground truncate">@{c.handle}</span>
                    <span className="block text-xs text-muted-foreground truncate">
                      {c.label}
                      {c.sub ? ` · ${c.sub}` : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting || !newComment.trim()} className="hover-scale">
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
