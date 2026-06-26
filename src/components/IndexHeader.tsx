import { useState } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, BarChart3, AlertTriangle, LogOut, Menu, X, Users, Headset, ListChecks, Handshake, CalendarSearch, ClipboardList } from "lucide-react";
import { usePendingTasksCount } from "@/hooks/use-delegations";
import { Switch } from "@/components/ui/switch";
import NotificationBell from "@/components/NotificationBell";
import MesAnaliseAlertsBell from "@/components/MesAnaliseAlertsBell";
import AcompanhamentoAlertsBell from "@/components/AcompanhamentoAlertsBell";
import logoKing from "@/assets/logo-king.png";

interface IndexHeaderProps {
  displayName: string;
  darkMode: boolean;
  onDarkModeChange: (val: boolean) => void;
  canSeeMesAnalise: boolean;
  canSeeAprovacoes?: boolean;
  canSeeReports?: boolean;
  canSeeInbox?: boolean;
  canSeeAcompanhamentoSuporte?: boolean;
  pendingApprovalsCount?: number;
  onSignOut: () => void;
}

export default function IndexHeader({ displayName, darkMode, onDarkModeChange, canSeeMesAnalise, canSeeAprovacoes, canSeeReports = true, canSeeInbox = true, canSeeAcompanhamentoSuporte = true, pendingApprovalsCount = 0, onSignOut }: IndexHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: pendingTasks = 0 } = usePendingTasksCount();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
        <img src={logoKing} alt="KoL" className="h-12 sm:h-16 w-auto" />
        <h1 className="text-heading text-foreground text-lg">NEXUS</h1>

        {/* Desktop nav */}
        <div className="ml-auto hidden lg:flex items-center gap-3">

          {canSeeMesAnalise && (
            <Link
              to="/mes-analise"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Mês de Análise
            </Link>
          )}
          {canSeeAprovacoes && (
            <Link
              to="/usuarios"
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              Usuários
              {pendingApprovalsCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                  {pendingApprovalsCount}
                </span>
              )}
            </Link>
          )}
          {canSeeAcompanhamentoSuporte && (
            <Link
              to="/acompanhamento-suporte"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              <Headset className="w-3.5 h-3.5" />
              Acompanhamento da Coordenação
            </Link>
          )}
          {canSeeReports && (
            <Link
              to="/relatorios"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Relatórios
            </Link>
          )}
          {/* Icon-only quick actions */}
          <div className="flex items-center gap-1 ml-1 pl-2 border-l border-border">
            {canSeeAcompanhamentoSuporte && (
              <Link
                to="/acompanhamento-do-suporte"
                title="Acompanhamento do Suporte"
                aria-label="Acompanhamento do Suporte"
                className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Handshake className="w-4 h-4" />
              </Link>
            )}
            {canSeeInbox && <NotificationBell />}
            <Link
              to="/tarefas"
              title="Tarefas"
              aria-label="Tarefas"
              className="relative flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <ListChecks className="w-4 h-4" />
              {pendingTasks > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                  {pendingTasks}
                </span>
              )}
            </Link>
            {canSeeAcompanhamentoSuporte && <AcompanhamentoAlertsBell />}
            {canSeeMesAnalise && <MesAnaliseAlertsBell />}
          </div>
          <div className="flex items-center gap-2 ml-1 pl-2 border-l border-border">
            <Sun className="w-4 h-4 text-muted-foreground" />
            <Switch checked={darkMode} onCheckedChange={onDarkModeChange} />
            <Moon className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-xs font-medium text-muted-foreground border-l border-border pl-3">
            {displayName}
          </span>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:bg-accent transition-colors"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="ml-auto lg:hidden p-2 rounded-md text-muted-foreground hover:bg-accent transition-colors"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-border bg-card px-4 py-3 space-y-3 animate-fade-in">

          {canSeeMesAnalise && (
            <Link
              to="/mes-analise"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Mês de Análise
            </Link>
          )}
          {canSeeAprovacoes && (
            <Link
              to="/usuarios"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Usuários</span>
              {pendingApprovalsCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                  {pendingApprovalsCount}
                </span>
              )}
            </Link>
          )}
          {canSeeAcompanhamentoSuporte && (
          <Link
            to="/acompanhamento-suporte"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            <Headset className="w-4 h-4" />
            <span>Acompanhamento da Coordenação</span>
          </Link>
          )}
          {canSeeAcompanhamentoSuporte && (
          <Link
            to="/acompanhamento-do-suporte"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            <Handshake className="w-4 h-4" />
            <span>Acompanhamento do Suporte</span>
          </Link>
          )}
          {canSeeInbox && (
            <NotificationBell compact label="Caixa de Entrada" onClick={() => setMenuOpen(false)} />
          )}
          <Link
            to="/tarefas"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            <ListChecks className="w-4 h-4" />
            <span>Tarefas</span>
            {pendingTasks > 0 && (
              <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                {pendingTasks}
              </span>
            )}
          </Link>
          {canSeeReports && (
          <Link
            to="/relatorios"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Relatórios
          </Link>
          )}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-muted-foreground">Tema</span>
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-muted-foreground" />
              <Switch checked={darkMode} onCheckedChange={onDarkModeChange} />
              <Moon className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-2 border-t border-border pt-3">
            <span className="text-sm font-medium text-muted-foreground">{displayName}</span>
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
