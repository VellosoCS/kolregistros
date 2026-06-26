import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, User, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIncidents, useIncidentsRealtime } from "@/hooks/use-incidents";
import {
  buildTeacherNameCanonicalMap,
  computeMesAnaliseSuggestions,
  type MesAnaliseLevel,
} from "@/lib/mes-analise-suggestions";
import { Incident } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

type Status = "normal" | "observacao" | "alerta" | "critico";

const STATUS_META: Record<Status, { label: string; cls: string; order: number }> = {
  critico: { label: "Crítico", cls: "bg-red-500 text-white hover:bg-red-500", order: 0 },
  alerta: { label: "Alerta", cls: "bg-orange-500 text-white hover:bg-orange-500", order: 1 },
  observacao: { label: "Observação", cls: "bg-yellow-400 text-yellow-950 hover:bg-yellow-400", order: 2 },
  normal: { label: "Normal", cls: "bg-emerald-500 text-white hover:bg-emerald-500", order: 3 },
};

const TWO_MONTHS_MS = 1000 * 60 * 60 * 24 * 62;

interface TeacherRow {
  name: string;
  status: Status;
  totalIncidents: number;
  lastIncidentAt: Date;
  incidents: Incident[];
}

function levelToStatus(level: MesAnaliseLevel): Status {
  return level;
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AcompanhamentoDoSuporte() {
  const { displayName } = useAuth();
  const { data: incidents = [], isLoading } = useIncidents();
  useIncidentsRealtime();
  const [query, setQuery] = useState("");
  const [openTeacher, setOpenTeacher] = useState<TeacherRow | null>(null);

  const rows = useMemo<TeacherRow[]>(() => {
    if (incidents.length === 0) return [];
    const now = Date.now();

    // Only incidents from last 2 months drive active status (decay rule).
    const recent = incidents.filter(
      (i) => now - i.createdAt.getTime() <= TWO_MONTHS_MS,
    );
    const suggestions = computeMesAnaliseSuggestions(recent);
    const statusByCanonical = new Map<string, Status>();
    for (const s of suggestions) {
      statusByCanonical.set(s.canonicalName, levelToStatus(s.level));
    }

    // Canonical map over ALL incidents to group teacher name variations.
    const canonical = buildTeacherNameCanonicalMap(incidents);
    const groups = new Map<string, Incident[]>();
    for (const inc of incidents) {
      const key = canonical.get(inc.teacherName.trim()) || inc.teacherName.trim();
      if (!key) continue;
      const arr = groups.get(key) ?? [];
      arr.push(inc);
      groups.set(key, arr);
    }

    const result: TeacherRow[] = [];
    for (const [name, list] of groups) {
      const sorted = [...list].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const last = sorted[0].createdAt;
      const hadRecent = now - last.getTime() <= TWO_MONTHS_MS;
      const status: Status = hadRecent ? statusByCanonical.get(name) ?? "normal" : "normal";
      result.push({
        name,
        status,
        totalIncidents: list.length,
        lastIncidentAt: last,
        incidents: sorted,
      });
    }
    return result;
  }, [incidents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? rows.filter((r) => r.name.toLowerCase().includes(q))
      : rows;
    return [...list].sort((a, b) => {
      const so = STATUS_META[a.status].order - STATUS_META[b.status].order;
      if (so !== 0) return so;
      return b.lastIncidentAt.getTime() - a.lastIncidentAt.getTime();
    });
  }, [rows, query]);

  const counts = useMemo(() => {
    const c = { critico: 0, alerta: 0, observacao: 0, normal: 0 };
    for (const r of rows) c[r.status]++;
    return c;
  }, [rows]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <h1 className="text-heading text-foreground text-lg">Acompanhamento do Suporte</h1>
          <span className="ml-auto text-xs text-muted-foreground">{displayName}</span>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <p className="text-sm text-muted-foreground">
          Visão geral dos professores com incidentes. Os estados seguem a mesma régua do Mês de Análise e
          retornam para <strong>Normal</strong> após 2 meses sem novos incidentes.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["critico", "alerta", "observacao", "normal"] as Status[]).map((s) => (
            <div
              key={s}
              className="rounded-lg border border-border bg-card p-3 flex items-center justify-between"
            >
              <div>
                <div className="text-xs text-muted-foreground">{STATUS_META[s].label}</div>
                <div className="text-2xl font-semibold text-foreground">{counts[s]}</div>
              </div>
              <Badge className={STATUS_META[s].cls}>{STATUS_META[s].label}</Badge>
            </div>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nome do professor..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_120px_160px_120px] gap-2 px-4 py-2 border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground">
            <div>Professor</div>
            <div>Estado</div>
            <div className="text-right">Incidentes</div>
            <div>Último incidente</div>
            <div className="text-right">Ações</div>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {query ? "Nenhum professor encontrado." : "Nenhum professor com incidentes ainda."}
            </div>
          ) : (
            <ul>
              {filtered.map((r) => (
                <li
                  key={r.name}
                  className="grid grid-cols-[1fr_140px_120px_160px_120px] gap-2 items-center px-4 py-2.5 border-b border-border last:border-b-0 hover:bg-accent/40"
                >
                  <div className="font-medium text-foreground truncate">{r.name}</div>
                  <div>
                    <Badge className={STATUS_META[r.status].cls}>{STATUS_META[r.status].label}</Badge>
                  </div>
                  <div className="text-right text-sm tabular-nums">{r.totalIncidents}</div>
                  <div className="text-sm text-muted-foreground">{fmtDate(r.lastIncidentAt)}</div>
                  <div className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOpenTeacher(r)}
                      className="h-8 gap-1.5"
                    >
                      <User className="w-3.5 h-3.5" />
                      Mini-perfil
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <Dialog open={!!openTeacher} onOpenChange={(o) => !o && setOpenTeacher(null)}>
        <DialogContent className="max-w-2xl">
          {openTeacher && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {openTeacher.name}
                  <Badge className={`ml-2 ${STATUS_META[openTeacher.status].cls}`}>
                    {STATUS_META[openTeacher.status].label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Total de {openTeacher.totalIncidents} incidente(s) — último em{" "}
                  {fmtDate(openTeacher.lastIncidentAt)}.
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
                {openTeacher.incidents.slice(0, 10).map((inc) => (
                  <Link
                    key={inc.id}
                    to={`/incidente/${inc.id}`}
                    className="block rounded-md border border-border p-3 hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">{inc.problemType}</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          inc.urgency === "Alta"
                            ? "bg-red-500/15 text-red-600"
                            : inc.urgency === "Média"
                              ? "bg-yellow-500/15 text-yellow-700"
                              : "bg-emerald-500/15 text-emerald-700"
                        }`}
                      >
                        {inc.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{inc.description}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {fmtDate(inc.createdAt)}
                      {inc.resolved && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">Resolvido</Badge>
                      )}
                    </div>
                  </Link>
                ))}
                {openTeacher.incidents.length > 10 && (
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    Exibindo os 10 últimos de {openTeacher.incidents.length}.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
