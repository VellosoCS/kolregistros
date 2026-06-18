import { useMemo, useState } from "react";
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  isToday,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Inbox,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  DelegationWithIncident,
  TaskStatus,
  useUpdateTaskDueDate,
} from "@/hooks/use-delegations";

const STATUS_DOT: Record<TaskStatus, string> = {
  pending: "bg-muted-foreground",
  accepted: "bg-primary",
  in_progress: "bg-urgency-medium",
  completed: "bg-urgency-low",
  declined: "bg-urgency-high",
};

const URGENCY_BORDER: Record<string, string> = {
  Alta: "border-l-urgency-high",
  Média: "border-l-urgency-medium",
  Baixa: "border-l-urgency-low",
};

function toISODate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default function TasksWeekCalendar({
  tasks,
  onOpenTask,
}: {
  tasks: DelegationWithIncident[];
  onOpenTask: (task: DelegationWithIncident) => void;
}) {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const byDay = useMemo(() => {
    const map = new Map<string, DelegationWithIncident[]>();
    const undated: DelegationWithIncident[] = [];
    for (const t of tasks) {
      if (!t.due_date) {
        undated.push(t);
        continue;
      }
      const key = t.due_date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return { map, undated };
  }, [tasks]);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setWeekStart((d) => addWeeks(d, -1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() =>
              setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
            }
          >
            Hoje
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setWeekStart((d) => addWeeks(d, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium ml-2 capitalize">
            {format(weekStart, "MMM yyyy", { locale: ptBR })} —{" "}
            {format(weekStart, "dd/MM")} a{" "}
            {format(addDays(weekStart, 6), "dd/MM")}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Arraste tarefas sem data para um dia, ou use o botão de calendário
          em cada cartão.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-3">
        {/* Week grid */}
        <div className="grid grid-cols-7 gap-2 min-h-[420px]">
          {days.map((day) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              tasks={byDay.map.get(toISODate(day)) ?? []}
              onOpenTask={onOpenTask}
            />
          ))}
        </div>

        {/* Undated sidebar */}
        <UndatedPanel tasks={byDay.undated} onOpenTask={onOpenTask} />
      </div>
    </div>
  );
}

function DayColumn({
  day,
  tasks,
  onOpenTask,
}: {
  day: Date;
  tasks: DelegationWithIncident[];
  onOpenTask: (task: DelegationWithIncident) => void;
}) {
  const updateDue = useUpdateTaskDueDate();
  const [isOver, setIsOver] = useState(false);
  const today = isToday(day);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const id = e.dataTransfer.getData("text/delegation-id");
    if (!id) return;
    try {
      await updateDue.mutateAsync({ id, due_date: toISODate(day) });
      toast.success(`Tarefa agendada para ${format(day, "dd/MM")}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao reagendar");
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col rounded-lg border bg-card transition-colors",
        today ? "border-primary/40" : "border-border",
        isOver && "ring-2 ring-primary bg-primary/5"
      )}
    >
      <div
        className={cn(
          "px-2 py-1.5 border-b text-center",
          today ? "border-primary/40 bg-primary/10" : "border-border"
        )}
      >
        <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
          {format(day, "EEE", { locale: ptBR })}
        </div>
        <div
          className={cn(
            "text-sm font-bold",
            today ? "text-primary" : "text-foreground"
          )}
        >
          {format(day, "dd/MM")}
        </div>
      </div>
      <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-[10px] text-muted-foreground/60 text-center pt-3 select-none">
            —
          </div>
        ) : (
          tasks.map((t) => (
            <CalendarTaskCard key={t.id} task={t} onOpen={() => onOpenTask(t)} />
          ))
        )}
      </div>
    </div>
  );
}

function UndatedPanel({
  tasks,
  onOpenTask,
}: {
  tasks: DelegationWithIncident[];
  onOpenTask: (task: DelegationWithIncident) => void;
}) {
  const updateDue = useUpdateTaskDueDate();
  const [isOver, setIsOver] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const id = e.dataTransfer.getData("text/delegation-id");
    if (!id) return;
    try {
      await updateDue.mutateAsync({ id, due_date: null });
      toast.success("Data removida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col rounded-lg border bg-muted/20 min-h-[200px] transition-colors",
        isOver ? "ring-2 ring-primary bg-primary/5 border-primary/40" : "border-border"
      )}
    >
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Inbox className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">Sem data</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-[11px] text-muted-foreground/70 text-center pt-3">
            Solte aqui para remover a data
          </div>
        ) : (
          tasks.map((t) => (
            <CalendarTaskCard key={t.id} task={t} onOpen={() => onOpenTask(t)} />
          ))
        )}
      </div>
    </div>
  );
}

function CalendarTaskCard({
  task,
  onOpen,
}: {
  task: DelegationWithIncident;
  onOpen: () => void;
}) {
  const updateDue = useUpdateTaskDueDate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const inc = task.incident;
  const selected = task.due_date ? parseISO(task.due_date) : undefined;

  const handlePick = async (d?: Date) => {
    if (!d) return;
    try {
      await updateDue.mutateAsync({ id: task.id, due_date: toISODate(d) });
      toast.success(`Agendada para ${format(d, "dd/MM")}`);
      setPickerOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  const handleClear = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateDue.mutateAsync({ id: task.id, due_date: null });
      toast.success("Data removida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/delegation-id", task.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onOpen}
      className={cn(
        "group rounded-md border bg-card border-l-4 p-1.5 text-[11px] cursor-grab active:cursor-grabbing hover:shadow-sm transition-all",
        URGENCY_BORDER[inc?.urgency ?? "Baixa"]
      )}
    >
      <div className="flex items-start gap-1">
        <span
          className={cn(
            "mt-1 w-1.5 h-1.5 rounded-full shrink-0",
            STATUS_DOT[task.status]
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate leading-tight">
            {inc?.urgency === "Alta" && (
              <Flame className="inline w-2.5 h-2.5 mr-0.5 text-urgency-high" />
            )}
            {inc?.problemType ?? "Incidente removido"}
          </div>
          {inc?.teacherName && (
            <div className="text-muted-foreground truncate text-[10px]">
              {inc.teacherName}
            </div>
          )}
        </div>
      </div>
      <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground"
            >
              <CalendarIcon className="w-2.5 h-2.5" />
              Mover
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0"
            align="start"
            onClick={(e) => e.stopPropagation()}
          >
            <Calendar
              mode="single"
              selected={selected}
              onSelect={handlePick}
              initialFocus
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
        {task.due_date && (
          <button
            onClick={handleClear}
            className="inline-flex items-center text-[10px] text-muted-foreground hover:text-urgency-high"
            title="Remover data"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
      </div>
    </div>
  );
}
