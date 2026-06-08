import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarIcon, MessageSquare, Users2, Search, ChevronDown, ChevronRight } from "lucide-react";
import { format, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useTeacherTracking,
  useUpdateTeacherTracking,
  useTeacherIncidents,
  type TeacherTracking,
} from "@/hooks/use-teacher-tracking";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import MeetingDialog from "@/components/MeetingDialog";

function toDateInput(d: Date): string {
  // YYYY-MM-DD local
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function DateCell({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (iso: string | null) => void;
  disabled?: boolean;
}) {
  const date = value ? new Date(value + "T00:00:00") : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn("h-8 px-2 text-xs justify-start font-normal w-full", !date && "text-muted-foreground")}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          {date ? format(date, "dd/MM/yyyy") : "—"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? toDateInput(d) : null)}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}

function TeacherRow({ t }: { t: TeacherTracking }) {
  const update = useUpdateTeacherTracking();
  const [expanded, setExpanded] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const { data: incidents = [] } = useTeacherIncidents(expanded ? t.teacher_name : null);

  const due = t.next_message_due ? new Date(t.next_message_due + "T00:00:00") : null;
  const isOverdue = due && !t.problem_resolved && (isToday(due) || isPast(due));

  const handleToggleFirst = (checked: boolean) => {
    update.mutate({
      id: t.id,
      patch: {
        first_message_sent: checked,
        first_message_date: checked ? t.first_message_date ?? toDateInput(new Date()) : null,
      },
    });
  };

  const handleToggleSecond = (checked: boolean) => {
    update.mutate({
      id: t.id,
      patch: {
        second_message_sent: checked,
        second_message_date: checked ? t.second_message_date ?? toDateInput(new Date()) : null,
      },
    });
  };

  return (
    <>
      <TableRow className={cn(isOverdue && "bg-urgency-high/5")}>
        <TableCell className="p-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded hover:bg-accent text-muted-foreground"
            aria-label="Expandir incidentes"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {t.teacher_name}
            {isOverdue && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-urgency-high/15 text-urgency-high">
                Mensagem vencida
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="p-2">
          <Checkbox
            checked={t.first_message_sent}
            onCheckedChange={(v) => handleToggleFirst(!!v)}
          />
        </TableCell>
        <TableCell className="p-2 min-w-[150px]">
          <DateCell
            value={t.first_message_date}
            disabled={!t.first_message_sent}
            onChange={(d) => update.mutate({ id: t.id, patch: { first_message_date: d } })}
          />
        </TableCell>
        <TableCell className="p-2">
          <Checkbox
            checked={t.second_message_sent}
            onCheckedChange={(v) => handleToggleSecond(!!v)}
          />
        </TableCell>
        <TableCell className="p-2 min-w-[150px]">
          <DateCell
            value={t.second_message_date}
            disabled={!t.second_message_sent}
            onChange={(d) => update.mutate({ id: t.id, patch: { second_message_date: d } })}
          />
        </TableCell>
        <TableCell className="p-2 min-w-[140px]">
          <span
            className={cn(
              "text-xs tabular-nums",
              isOverdue ? "text-urgency-high font-semibold" : "text-muted-foreground",
            )}
          >
            {due ? format(due, "dd/MM/yyyy") : "—"}
          </span>
        </TableCell>
        <TableCell className="p-2 text-center">
          <Checkbox
            checked={t.problem_resolved}
            onCheckedChange={(v) => update.mutate({ id: t.id, patch: { problem_resolved: !!v } })}
          />
        </TableCell>
        <TableCell className="p-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setMeetingOpen(true)}
          >
            <Users2 className="w-3.5 h-3.5" />
            Reunião
          </Button>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={9} className="p-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              Incidentes de Controle Interno ({incidents.length})
            </div>
            {incidents.length === 0 ? (
              <div className="text-xs text-muted-foreground">Nenhum incidente encontrado.</div>
            ) : (
              <div className="divide-y divide-border rounded-md border border-border bg-background">
                {incidents.map((inc) => (
                  <Link
                    key={inc.id}
                    to={`/incidente/${inc.id}`}
                    className="block px-3 py-2 text-xs hover:bg-accent/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{inc.problemType}</span>
                      <span className="tabular-nums text-muted-foreground whitespace-nowrap">
                        {format(inc.createdAt, "dd/MM/yyyy")}
                      </span>
                    </div>
                    {inc.description && (
                      <div className="text-muted-foreground line-clamp-2 mt-0.5">{inc.description}</div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </TableCell>
        </TableRow>
      )}

      <MeetingDialog
        open={meetingOpen}
        onOpenChange={setMeetingOpen}
        teacherId={t.id}
        teacherName={t.teacher_name}
      />
    </>
  );
}

export default function AcompanhamentoSuporte() {
  const { data: teachers = [], isLoading } = useTeacherTracking();
  const [search, setSearch] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers
      .filter((t) => showResolved || !t.problem_resolved)
      .filter((t) => !q || t.teacher_name.toLowerCase().includes(q));
  }, [teachers, search, showResolved]);

  const overdueCount = teachers.filter(
    (t) => !t.problem_resolved && t.next_message_due && new Date(t.next_message_due + "T00:00:00") <= new Date(),
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <h1 className="text-heading text-foreground">Acompanhamento do Suporte</h1>
          {overdueCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-urgency-high/15 text-urgency-high">
              {overdueCount} pendente(s)
            </span>
          )}
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar professor..."
              className="pl-8 h-9"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Checkbox checked={showResolved} onCheckedChange={(v) => setShowResolved(!!v)} />
            Mostrar resolvidos
          </label>
          <div className="ml-auto text-xs text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
            Total: {teachers.length} professores
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 p-2"></TableHead>
                <TableHead>Professor</TableHead>
                <TableHead className="text-center">1ª Msg?</TableHead>
                <TableHead>Data 1ª Msg</TableHead>
                <TableHead className="text-center">2ª Msg?</TableHead>
                <TableHead>Data 2ª Msg</TableHead>
                <TableHead>Próxima prevista</TableHead>
                <TableHead className="text-center">Resolvido?</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                    Nenhum professor para acompanhar.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => <TeacherRow key={t.id} t={t} />)
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
