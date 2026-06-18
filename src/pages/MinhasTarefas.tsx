import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  LayoutGrid,
  Loader2,
  ListChecks,
  Play,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CachedImage from "@/components/CachedImage";
import TaskAcceptDialog from "@/components/TaskAcceptDialog";
import TasksWeekCalendar from "@/components/TasksWeekCalendar";
import { cn } from "@/lib/utils";
import {
  DelegationWithIncident,
  TaskStatus,
  useDelegationsRealtime,
  useMyTasks,
  useUpdateTaskStatus,
} from "@/hooks/use-delegations";
import { useBatchSignedUrls } from "@/hooks/use-batch-signed-urls";
import { toast } from "sonner";

type FilterKey = "all" | TaskStatus;
type ViewMode = "list" | "calendar";


const STATUS_META: Record<TaskStatus, { label: string; badge: string; border: string; dot: string }> = {
  pending: {
    label: "Pendente",
    badge: "bg-muted text-foreground border-border",
    border: "border-l-muted-foreground/40",
    dot: "bg-muted-foreground",
  },
  accepted: {
    label: "Aceita",
    badge: "bg-primary/15 text-primary border-primary/30",
    border: "border-l-primary",
    dot: "bg-primary",
  },
  in_progress: {
    label: "Em andamento",
    badge: "bg-urgency-medium/15 text-urgency-medium border-urgency-medium/30",
    border: "border-l-urgency-medium",
    dot: "bg-urgency-medium",
  },
  completed: {
    label: "Concluída",
    badge: "bg-urgency-low/15 text-urgency-low border-urgency-low/30",
    border: "border-l-urgency-low",
    dot: "bg-urgency-low",
  },
  declined: {
    label: "Recusada",
    badge: "bg-urgency-high/15 text-urgency-high border-urgency-high/30",
    border: "border-l-urgency-high",
    dot: "bg-urgency-high",
  },
};

const URGENCY_BADGE: Record<string, string> = {
  Alta: "border-urgency-high/40 bg-urgency-high/10 text-urgency-high",
  Média: "border-urgency-medium/40 bg-urgency-medium/10 text-urgency-medium",
  Baixa: "border-urgency-low/40 bg-urgency-low/10 text-urgency-low",
};

export default function MinhasTarefas() {
  useDelegationsRealtime();
  const { data: tasks = [], isLoading } = useMyTasks();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [openTask, setOpenTask] = useState<DelegationWithIncident | null>(null);


  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: tasks.length,
      pending: 0,
      accepted: 0,
      in_progress: 0,
      completed: 0,
      declined: 0,
    };
    for (const t of tasks) c[t.status] = (c[t.status] || 0) + 1;
    return c;
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .filter((t) => (filter === "all" ? true : t.status === filter))
      .filter((t) => {
        if (!q) return true;
        const inc = t.incident;
        return (
          (inc?.teacherName ?? "").toLowerCase().includes(q) ||
          (inc?.problemType ?? "").toLowerCase().includes(q) ||
          (inc?.description ?? "").toLowerCase().includes(q) ||
          (t.delegated_by_name ?? "").toLowerCase().includes(q)
        );
      });
  }, [tasks, filter, search]);

  // Pre-resolve signed URLs for all visible cards
  const signList = useMemo(
    () =>
      filtered
        .map((t) => t.incident)
        .filter((i): i is NonNullable<typeof i> => !!i && i.imageUrls.length > 0)
        .map((i) => ({ id: i.id, imageUrls: i.imageUrls })),
    [filtered]
  );
  const signedMap = useBatchSignedUrls(signList);

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
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-primary" />
            <h1 className="text-heading text-foreground">Minhas Tarefas</h1>
          </div>
          {counts.pending > 0 && (
            <span className="ml-2 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-primary/15 text-primary">
              {counts.pending} pendente{counts.pending > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "Todas"],
              ["pending", "Pendentes"],
              ["accepted", "Aceitas"],
              ["in_progress", "Em andamento"],
              ["completed", "Concluídas"],
              ["declined", "Recusadas"],
            ] as [FilterKey, string][]
          ).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={filter === key ? "default" : "outline"}
              className="h-8 text-xs"
              onClick={() => setFilter(key)}
            >
              {label} ({counts[key]})
            </Button>
          ))}
          <div className="relative ml-auto flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por professor, tipo, descrição..."
              className="pl-8 h-9"
            />
          </div>
        </div>

        {/* Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Skeleton className="h-44 rounded-lg" />
            <Skeleton className="h-44 rounded-lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Nenhuma tarefa {filter === "all" ? "encontrada" : `nesta categoria`}.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filtered.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                signedUrls={t.incident ? signedMap.get(t.incident.id) ?? [] : []}
                onOpen={() => setOpenTask(t)}
              />
            ))}
          </div>
        )}
      </div>

      <TaskAcceptDialog open={!!openTask} onOpenChange={(v) => !v && setOpenTask(null)} task={openTask} />
    </div>
  );
}

function TaskCard({
  task,
  signedUrls,
  onOpen,
}: {
  task: DelegationWithIncident;
  signedUrls: string[];
  onOpen: () => void;
}) {
  const updateStatus = useUpdateTaskStatus();
  const inc = task.incident;
  const meta = STATUS_META[task.status];

  const dueInfo = useMemo(() => {
    if (!task.due_date) return null;
    const date = new Date(task.due_date + "T00:00:00");
    const diff = differenceInCalendarDays(date, new Date());
    let tone = "bg-urgency-low/15 text-urgency-low border-urgency-low/30";
    let label = `em ${diff}d`;
    if (diff < 0) {
      tone = "bg-urgency-high/15 text-urgency-high border-urgency-high/30";
      label = `${Math.abs(diff)}d atrasada`;
    } else if (diff <= 2) {
      tone = "bg-urgency-medium/15 text-urgency-medium border-urgency-medium/30";
      label = diff === 0 ? "hoje" : `em ${diff}d`;
    }
    return { date, tone, label };
  }, [task.due_date]);

  const handleAct = async (status: TaskStatus, msg: string) => {
    try {
      await updateStatus.mutateAsync({ id: task.id, status });
      toast.success(msg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar tarefa");
    }
  };

  return (
    <article
      className={cn(
        "group rounded-lg border border-border bg-card border-l-4 shadow-sm hover:shadow-md transition-all",
        meta.border
      )}
    >
      {/* Header */}
      <div className="p-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {inc && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded border",
                  URGENCY_BADGE[inc.urgency] ?? URGENCY_BADGE.Baixa
                )}
              >
                {inc.urgency === "Alta" && <Flame className="w-3 h-3" />}
                {inc.urgency}
              </span>
            )}
            <h3 className="text-sm font-semibold truncate">
              {inc?.problemType ?? "Incidente removido"}
            </h3>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {inc ? format(inc.createdAt, "dd/MM/yyyy", { locale: ptBR }) : "—"}
            </span>
            <span>•</span>
            <span>Delegado por {task.delegated_by_name ?? "—"}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded border", meta.badge)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </span>
          {dueInfo && (
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded border", dueInfo.tone)}>
              <Clock className="w-3 h-3" />
              {dueInfo.label}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3 space-y-2">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <Meta label="Professor" value={inc?.teacherName ?? "—"} />
          <Meta label="Responsável" value={inc?.coordinator ?? "—"} />
        </div>
        {inc?.description && (
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {inc.description}
          </p>
        )}
        {signedUrls.length > 0 && (
          <div className="flex gap-1.5">
            {signedUrls.slice(0, 4).map((src, i) => (
              <CachedImage
                key={i}
                src={src}
                alt={`Mídia ${i + 1}`}
                className="w-12 h-12 object-cover rounded border border-border"
              />
            ))}
            {signedUrls.length > 4 && (
              <div className="w-12 h-12 rounded border border-border bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                +{signedUrls.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 py-2 border-t border-border bg-muted/20 flex flex-wrap items-center gap-1.5 justify-end rounded-b-lg">
        {inc && (
          <Button asChild size="sm" variant="ghost" className="h-7 text-[11px] mr-auto">
            <Link to={`/incidente/${inc.id}`}>
              <ExternalLink className="w-3 h-3" />
              Ver incidente
            </Link>
          </Button>
        )}
        {task.status === "pending" && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px] text-urgency-high hover:text-urgency-high"
              disabled={updateStatus.isPending}
              onClick={() => handleAct("declined", "Tarefa recusada")}
            >
              <X className="w-3 h-3" />
              Recusar
            </Button>
            <Button
              size="sm"
              className="h-7 text-[11px]"
              disabled={updateStatus.isPending}
              onClick={onOpen}
            >
              <ChevronRight className="w-3 h-3" />
              Detalhes / Aceitar
            </Button>
          </>
        )}
        {task.status === "accepted" && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              disabled={updateStatus.isPending}
              onClick={() => handleAct("in_progress", "Tarefa iniciada")}
            >
              <Play className="w-3 h-3" />
              Iniciar
            </Button>
            <Button
              size="sm"
              className="h-7 text-[11px]"
              disabled={updateStatus.isPending}
              onClick={() => handleAct("completed", "Tarefa concluída")}
            >
              <CheckCircle2 className="w-3 h-3" />
              Concluir
            </Button>
          </>
        )}
        {task.status === "in_progress" && (
          <Button
            size="sm"
            className="h-7 text-[11px]"
            disabled={updateStatus.isPending}
            onClick={() => handleAct("completed", "Tarefa concluída")}
          >
            {updateStatus.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            Concluir
          </Button>
        )}
        {(task.status === "completed" || task.status === "declined") && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px] text-muted-foreground"
            disabled={updateStatus.isPending}
            onClick={() => handleAct("accepted", "Tarefa reaberta")}
          >
            Reabrir
          </Button>
        )}
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-wide font-semibold text-muted-foreground">
        {label}
      </div>
      <div className="text-xs truncate font-medium">{value}</div>
    </div>
  );
}
