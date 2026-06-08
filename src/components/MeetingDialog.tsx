import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAddTeacherMeeting, useTeacherMeetings } from "@/hooks/use-teacher-tracking";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  teacherName: string;
}

export default function MeetingDialog({ open, onOpenChange, teacherId, teacherName }: Props) {
  const { user, profileName, displayName } = useAuth();
  const { data: meetings = [] } = useTeacherMeetings(open ? teacherId : null);
  const addMeeting = useAddTeacherMeeting();

  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    await addMeeting.mutateAsync({
      teacher_id: teacherId,
      coordinator_id: user?.id ?? null,
      coordinator_name: profileName || displayName || "Coordenador",
      meeting_date: date.toISOString(),
      notes: notes.trim() || null,
    });
    setNotes("");
    setDate(new Date());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Reuniões com {teacherName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-border p-3 space-y-3">
            <div className="text-sm font-medium">Registrar nova reunião</div>

            <div className="space-y-2">
              <Label>Data da reunião</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                  >
                    <CalendarIcon />
                    {date ? format(date, "PPP", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Resumo do que foi conversado, próximos passos..."
                rows={4}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={addMeeting.isPending}>
                {addMeeting.isPending ? "Registrando..." : "Registrar reunião"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Histórico</div>
            {meetings.length === 0 ? (
              <div className="text-xs text-muted-foreground">Nenhuma reunião registrada ainda.</div>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-border border border-border rounded-md">
                {meetings.map((m) => (
                  <div key={m.id} className="p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{m.coordinator_name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {format(new Date(m.meeting_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {m.notes && <div className="text-muted-foreground whitespace-pre-wrap">{m.notes}</div>}
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
