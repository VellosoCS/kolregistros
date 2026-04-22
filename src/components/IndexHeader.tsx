import { useState } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, BarChart3, AlertTriangle, LogOut, Menu, X, UserCheck, Inbox } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import NotificationBell from "@/components/NotificationBell";
import logoKing from "@/assets/logo-king.png";

interface IndexHeaderProps {
  displayName: string;
  darkMode: boolean;
  onDarkModeChange: (val: boolean) => void;
  canSeeMesAnalise: boolean;
  canSeeAprovacoes?: boolean;
  pendingApprovalsCount?: number;
  onSignOut: () => void;
}

export default function IndexHeader({ displayName, darkMode, onDarkModeChange, canSeeMesAnalise, canSeeAprovacoes, pendingApprovalsCount = 0, onSignOut }: IndexHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
        <img src={logoKing} alt="KoL" className="h-12 sm:h-16 w-auto" />
        <h1 className="text-heading text-foreground text-lg">NEXUS</h1>

        {/* Desktop nav */}
        <div className="ml-auto hidden md:flex items-center gap-3">
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
              to="/aprovacoes"
              className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Aprovações
              {pendingApprovalsCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                  {pendingApprovalsCount}
                </span>
              )}
            </Link>
          )}
          <Link
            to="/relatorios"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Relatórios
          </Link>
          <NotificationBell />
          <div className="flex items-center gap-2">
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
          className="ml-auto md:hidden p-2 rounded-md text-muted-foreground hover:bg-accent transition-colors"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-3 animate-fade-in">
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
              to="/aprovacoes"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              <UserCheck className="w-4 h-4" />
              <span>Aprovações</span>
              {pendingApprovalsCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                  {pendingApprovalsCount}
                </span>
              )}
            </Link>
          )}
          <Link
            to="/relatorios"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Relatórios
          </Link>
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
