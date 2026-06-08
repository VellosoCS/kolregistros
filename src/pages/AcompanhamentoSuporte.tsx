import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CalendarIcon,
  MessageSquare,
  Users2,
  Search,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Folder,
  Trash2,
  Pencil,
  X,
  Plus,
} from "lucide-react";
import { format, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useTeacherTracking,
  useUpdateTeacherTracking,
  useBulkUpdateTeacherTracking,
  useTeacherIncidents,
  type TeacherTracking,
} from "@/hooks/use-teacher-tracking";
import {
  useTeacherFolders,
  useTeacherFolderMembers,
  useCreateTeacherFolder,
  useRenameTeacherFolder,
  useDeleteTeacherFolder,
  useAddTeachersToFolder,
  useRemoveTeacherFromFolder,
} from "@/hooks/use-teacher-folders";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import MeetingDialog from "@/components/MeetingDialog";

function toDateInput(d: Date): string {
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

function TeacherRow({
  t,
  selected,
  onToggleSelect,
  currentFolderId,
  onRemoveFromFolder,
}: {
  t: TeacherTracking;
  selected: boolean;
  onToggleSelect: (v: boolean) => void;
  currentFolderId: string | null;
  onRemoveFromFolder?: () => void;
}) {
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
        <TableCell className="p-2 w-10">
          <Checkbox checked={selected} onCheckedChange={(v) => onToggleSelect(!!v)} />
        </TableCell>
        <TableCell className="p-2 w-10">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded hover:bg-accent text-muted-foreground"
            aria-label="Expandir incidentes"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </TableCell>
        <TableCell className="font-medium max-w-[180px]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate">{t.teacher_name}</span>
            {isOverdue && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-urgency-high/15 text-urgency-high whitespace-nowrap">
                Vencida
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="p-2 text-center w-16">
          <Checkbox checked={t.first_message_sent} onCheckedChange={(v) => handleToggleFirst(!!v)} />
        </TableCell>
        <TableCell className="p-2 text-center w-[140px] hidden md:table-cell">
          <DateCell
            value={t.first_message_date}
            disabled={!t.first_message_sent}
            onChange={(d) => update.mutate({ id: t.id, patch: { first_message_date: d } })}
          />
        </TableCell>
        <TableCell className="p-2 text-center w-16">
          <Checkbox checked={t.second_message_sent} onCheckedChange={(v) => handleToggleSecond(!!v)} />
        </TableCell>
        <TableCell className="p-2 text-center w-[140px] hidden md:table-cell">
          <DateCell
            value={t.second_message_date}
            disabled={!t.second_message_sent}
            onChange={(d) => update.mutate({ id: t.id, patch: { second_message_date: d } })}
          />
        </TableCell>
        <TableCell className="p-2 text-center w-[130px] hidden lg:table-cell">
          <span
            className={cn(
              "text-xs tabular-nums whitespace-nowrap",
              isOverdue ? "text-urgency-high font-semibold" : "text-muted-foreground",
            )}
          >
            {due ? format(due, "dd/MM/yyyy") : "—"}
          </span>
        </TableCell>
        <TableCell className="p-2 text-center w-20">
          <Checkbox
            checked={t.problem_resolved}
            onCheckedChange={(v) => update.mutate({ id: t.id, patch: { problem_resolved: !!v } })}
          />
        </TableCell>
        <TableCell className="p-2 text-center w-[130px]">
          <div className="flex items-center justify-center gap-1">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setMeetingOpen(true)}>
              <Users2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reunião</span>
            </Button>
            {currentFolderId && onRemoveFromFolder && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-urgency-high"
                onClick={onRemoveFromFolder}
                title="Remover da pasta"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="bg-muted/30">
          <TableCell colSpan={10} className="p-3">
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

      <MeetingDialog open={meetingOpen} onOpenChange={setMeetingOpen} teacherId={t.id} teacherName={t.teacher_name} />
    </>
  );
}

export default function AcompanhamentoSuporte() {
  const { data: teachers = [], isLoading } = useTeacherTracking();
  const { data: folders = [] } = useTeacherFolders();
  const { data: folderMembers = [] } = useTeacherFolderMembers();
  const createFolder = useCreateTeacherFolder();
  const renameFolder = useRenameTeacherFolder();
  const deleteFolder = useDeleteTeacherFolder();
  const addToFolder = useAddTeachersToFolder();
  const removeFromFolder = useRemoveTeacherFromFolder();
  const bulkUpdate = useBulkUpdateTeacherTracking();

  const [search, setSearch] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null;

  const folderTeacherIds = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const m of folderMembers) {
      if (!map.has(m.folder_id)) map.set(m.folder_id, new Set());
      map.get(m.folder_id)!.add(m.teacher_id);
    }
    return map;
  }, [folderMembers]);

  const activeFolderTeacherIds = activeFolderId ? folderTeacherIds.get(activeFolderId) ?? new Set<string>() : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers
      .filter((t) => (activeFolderTeacherIds ? activeFolderTeacherIds.has(t.id) : true))
      .filter((t) => showResolved || !t.problem_resolved)
      .filter((t) => !q || t.teacher_name.toLowerCase().includes(q));
  }, [teachers, search, showResolved, activeFolderTeacherIds]);

  const overdueCount = filtered.filter(
    (t) => !t.problem_resolved && t.next_message_due && new Date(t.next_message_due + "T00:00:00") <= new Date(),
  ).length;

  const toggleSelect = (id: string, v: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (v) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const handleCreateFolder = async () => {
    const folder = await createFolder.mutateAsync(newName).catch(() => null);
    if (folder) {
      setCreateOpen(false);
      setNewName("");
      setActiveFolderId(folder.id);
    }
  };

  const handleAddSelectedToFolder = async (folderId: string) => {
    await addToFolder.mutateAsync({ folderId, teacherIds: Array.from(selected) });
    clearSelection();
  };

  const handleRename = async () => {
    if (!activeFolder) return;
    await renameFolder.mutateAsync({ id: activeFolder.id, name: renameValue });
    setRenameOpen(false);
  };

  const handleDelete = async () => {
    if (!activeFolder) return;
    await deleteFolder.mutateAsync(activeFolder.id);
    setDeleteOpen(false);
    setActiveFolderId(null);
  };

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
          <h1 className="text-heading text-foreground">Acompanhamento da Coordenação</h1>
          {overdueCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-urgency-high/15 text-urgency-high">
              {overdueCount} pendente(s)
            </span>
          )}
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Folder tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={activeFolderId === null ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setActiveFolderId(null)}
          >
            Todos ({teachers.length})
          </Button>
          {folders.map((f) => {
            const count = folderTeacherIds.get(f.id)?.size ?? 0;
            return (
              <Button
                key={f.id}
                variant={activeFolderId === f.id ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setActiveFolderId(f.id)}
              >
                <Folder className="w-3.5 h-3.5" />
                {f.name} ({count})
              </Button>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              setNewName("");
              setCreateOpen(true);
            }}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Nova pasta
          </Button>
          {activeFolder && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => {
                  setRenameValue(activeFolder.name);
                  setRenameOpen(true);
                }}
              >
                <Pencil className="w-3.5 h-3.5" />
                Renomear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-urgency-high hover:text-urgency-high"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </Button>
            </>
          )}
        </div>

        {/* Filters */}
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
            {activeFolder ? `Pasta: ${activeFolder.name}` : `Total: ${teachers.length} professores`}
          </div>
        </div>

        {/* Selection bar */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
            <span className="text-sm font-medium">
              {selected.size} selecionado(s)
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar à pasta
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Escolher pasta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {folders.length === 0 ? (
                  <DropdownMenuItem disabled>Nenhuma pasta criada</DropdownMenuItem>
                ) : (
                  folders.map((f) => (
                    <DropdownMenuItem key={f.id} onClick={() => handleAddSelectedToFolder(f.id)}>
                      <Folder className="w-3.5 h-3.5 mr-2" />
                      {f.name}
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setNewName("");
                    setCreateOpen(true);
                  }}
                >
                  <FolderPlus className="w-3.5 h-3.5 mr-2" />
                  Criar nova pasta...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Marcar mensagem enviada
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Hoje</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    bulkUpdate.mutate({
                      ids: Array.from(selected),
                      patch: { first_message_sent: true, first_message_date: toDateInput(new Date()) },
                    });
                    clearSelection();
                  }}
                >
                  Marcar 1ª mensagem
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    bulkUpdate.mutate({
                      ids: Array.from(selected),
                      patch: { second_message_sent: true, second_message_date: toDateInput(new Date()) },
                    });
                    clearSelection();
                  }}
                >
                  Marcar 2ª mensagem
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => {
                bulkUpdate.mutate({ ids: Array.from(selected), patch: { problem_resolved: true } });
                clearSelection();
              }}
            >
              Marcar resolvido
            </Button>

            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearSelection}>
              Limpar seleção
            </Button>
          </div>
        )}

        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <Table className="table-fixed min-w-[720px] md:min-w-[900px] lg:min-w-[1040px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 p-2">
                  <Checkbox
                    checked={filtered.length > 0 && filtered.every((t) => selected.has(t.id))}
                    onCheckedChange={(v) => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (v) filtered.forEach((t) => next.add(t.id));
                        else filtered.forEach((t) => next.delete(t.id));
                        return next;
                      });
                    }}
                  />
                </TableHead>
                <TableHead className="w-10 p-2"></TableHead>
                <TableHead className="max-w-[180px]">Professor</TableHead>
                <TableHead className="text-center w-16">1ª Msg?</TableHead>
                <TableHead className="text-center w-[140px] hidden md:table-cell">Data 1ª Msg</TableHead>
                <TableHead className="text-center w-16">2ª Msg?</TableHead>
                <TableHead className="text-center w-[140px] hidden md:table-cell">Data 2ª Msg</TableHead>
                <TableHead className="text-center w-[130px] hidden lg:table-cell">Próxima prevista</TableHead>
                <TableHead className="text-center w-20">Resolvido?</TableHead>
                <TableHead className="text-center w-[130px]">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-8">
                    {activeFolder
                      ? "Esta pasta está vazia. Selecione professores na aba 'Todos' para adicioná-los."
                      : "Nenhum professor para acompanhar."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TeacherRow
                    key={t.id}
                    t={t}
                    selected={selected.has(t.id)}
                    onToggleSelect={(v) => toggleSelect(t.id, v)}
                    currentFolderId={activeFolderId}
                    onRemoveFromFolder={
                      activeFolderId
                        ? () => removeFromFolder.mutate({ folderId: activeFolderId, teacherId: t.id })
                        : undefined
                    }
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create folder dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova pasta de acompanhamento</DialogTitle>
            <DialogDescription>
              Crie uma pasta para acompanhar um grupo específico de professores.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder="Ex.: Em observação"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) handleCreateFolder();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newName.trim() || createFolder.isPending}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename folder dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear pasta</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && renameValue.trim()) handleRename();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRename} disabled={!renameValue.trim() || renameFolder.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete folder confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pasta?</AlertDialogTitle>
            <AlertDialogDescription>
              A pasta "{activeFolder?.name}" será removida. Os professores continuarão existindo na aba "Todos".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-urgency-high hover:bg-urgency-high/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
