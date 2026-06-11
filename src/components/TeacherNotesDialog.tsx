import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useTeacherNotes, useAddTeacherNote, useDeleteTeacherNote } from "@/hooks/use-teacher-tracking";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  teacherName: string;
}

export default function TeacherNotesDialog({ open, onOpenChange, teacherId, teacherName }: Props) {
  const { user, profileName, displayName } = useAuth();
  const { data: notes = [] } = useTeacherNotes(open ? teacherId : null);
  const addNote = useAddTeacherNote();
  const deleteNote = useDeleteTeacherNote();

  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    await addNote.mutateAsync({
      teacher_id: teacherId,
      content: trimmed,
      created_by: user?.id ?? null,
      created_by_name: profileName || displayName || "Coordenador",
    });
    setContent("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Observações sobre {teacherName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-border p-3 space-y-3">
            <div className="text-sm font-medium">Nova observação</div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva uma observação sobre o professor..."
              rows={3}
            />
            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={addNote.isPending || !content.trim()}>
                {addNote.isPending ? "Salvando..." : "Salvar observação"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Histórico ({notes.length})</div>
            {notes.length === 0 ? (
              <div className="text-xs text-muted-foreground">Nenhuma observação registrada.</div>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-border border border-border rounded-md">
                {notes.map((n) => (
                  <div key={n.id} className="p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{n.created_by_name || "Anônimo"}</span>
                      <div className="flex items-center gap-2">
                        <span className="tabular-nums text-muted-foreground">
                          {format(new Date(n.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                        <button
                          onClick={() => deleteNote.mutate({ id: n.id, teacherId: n.teacher_id })}
                          className="text-muted-foreground hover:text-urgency-high"
                          title="Excluir"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-muted-foreground whitespace-pre-wrap">{n.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
