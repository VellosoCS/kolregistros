import { Link } from "react-router-dom";
import { Moon, Sun, BarChart3, AlertTriangle, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import logoKing from "@/assets/logo-king.png";

interface IndexHeaderProps {
  displayName: string;
  darkMode: boolean;
  onDarkModeChange: (val: boolean) => void;
  canSeeMesAnalise: boolean;
  onSignOut: () => void;
}

export default function IndexHeader({ displayName, darkMode, onDarkModeChange, canSeeMesAnalise, onSignOut }: IndexHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
        <img src={logoKing} alt="KoL" className="h-16 w-auto" />
        <h1 className="text-heading text-foreground text-lg">NEXUS</h1>
        <div className="ml-auto flex items-center gap-3">
          {canSeeMesAnalise && (
            <Link
              to="/mes-analise"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Mês de Análise
            </Link>
          )}
          <Link
            to="/relatorios"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Relatórios
          </Link>
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
      </div>
    </header>
  );
}
