import { useState, useRef, useEffect, useMemo } from "react";
import { X, AtSign } from "lucide-react";
import { useApprovedUsers, nameToHandle, ApprovedUser } from "@/hooks/use-approved-users";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_LABELS: Record<ApprovedUser["role"], string> = {
  coordenacao: "Coordenação",
  suporte: "Suporte",
  suporte_aluno: "Suporte ao Aluno",
};

export interface SelectedRecipient {
  user_id: string;
  display_name: string | null;
  handle: string;
}

interface Props {
  selected: SelectedRecipient[];
  onChange: (next: SelectedRecipient[]) => void;
}

export default function MentionInput({ selected, onChange }: Props) {
  const { user } = useAuth();
  const { data: users = [], isLoading } = useApprovedUsers();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.user_id)), [selected]);

  // Detecta gatilho "@" — lista aparece quando query começa com @ (ou está vazia e foco aberto)
  const triggerActive = query.startsWith("@") || open;
  const search = query.startsWith("@") ? query.slice(1).toLowerCase() : query.toLowerCase();

  const candidates = useMemo(() => {
    return users
      .filter((u) => u.user_id !== user?.id) // não mostra a si mesmo
      .filter((u) => !selectedIds.has(u.user_id))
      .filter((u) => {
        if (!search) return true;
        const handle = nameToHandle(u.display_name, u.email);
        const name = (u.display_name || "").toLowerCase();
        return handle.includes(search) || name.includes(search);
      })
      .slice(0, 8);
  }, [users, user?.id, selectedIds, search]);

  useEffect(() => {
    setActiveIdx(0);
  }, [search, candidates.length]);

  // Fecha ao clicar fora
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const addRecipient = (u: ApprovedUser) => {
    onChange([
      ...selected,
      {
        user_id: u.user_id,
        display_name: u.display_name,
        handle: nameToHandle(u.display_name, u.email),
      },
    ]);
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  };

  const removeRecipient = (userId: string) => {
    onChange(selected.filter((s) => s.user_id !== userId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!triggerActive || candidates.length === 0) {
      if (e.key === "Backspace" && query === "" && selected.length > 0) {
        e.preventDefault();
        removeRecipient(selected[selected.length - 1].user_id);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, candidates.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      addRecipient(candidates[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && query === "" && selected.length > 0) {
      e.preventDefault();
      removeRecipient(selected[selected.length - 1].user_id);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="min-h-[42px] w-full px-2 py-1.5 bg-input rounded-md focus-within:ring-2 focus-within:ring-ring transition-all flex flex-wrap items-center gap-1.5"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((s) => (
          <span
            key={s.user_id}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/15 text-primary"
          >
            <AtSign className="w-3 h-3" />
            {s.handle}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeRecipient(s.user_id);
              }}
              className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              aria-label={`Remover ${s.handle}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? "Digite @ para delegar a alguém" : ""}
          className="flex-1 min-w-[140px] bg-transparent text-body text-foreground outline-none placeholder:text-muted-foreground py-1"
          autoComplete="off"
        />
      </div>

      {open && triggerActive && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden animate-fade-in">
          {isLoading ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">Carregando...</div>
          ) : candidates.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              {search ? `Nenhum usuário encontrado para "${search}"` : "Sem usuários disponíveis"}
            </div>
          ) : (
            <ul className="max-h-60 overflow-y-auto">
              {candidates.map((u, idx) => {
                const handle = nameToHandle(u.display_name, u.email);
                return (
                  <li key={u.user_id}>
                    <button
                      type="button"
                      onClick={() => addRecipient(u)}
                      onMouseEnter={() => setActiveIdx(idx)}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors ${
                        idx === activeIdx ? "bg-accent" : "hover:bg-accent/60"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {(u.display_name || u.email || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {u.display_name || u.email}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          @{handle} · {ROLE_LABELS[u.role]}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
