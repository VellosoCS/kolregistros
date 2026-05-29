import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function AcompanhamentoSuporte() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <h1 className="text-heading text-foreground">Acompanhamento do Suporte</h1>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-12">
        <p className="text-sm text-muted-foreground">Em breve.</p>
      </div>
    </div>
  );
}
