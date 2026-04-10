import { ProblemType, UrgencyLevel, PROBLEM_TYPES, URGENCY_LEVELS } from "@/lib/types";
import { Search } from "lucide-react";

interface IncidentFiltersProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  filterType: ProblemType | "Todos";
  onFilterTypeChange: (type: ProblemType | "Todos") => void;
  filterUrgency: UrgencyLevel | "Todas";
  onFilterUrgencyChange: (level: UrgencyLevel | "Todas") => void;
  filterCoordinator: string;
  onFilterCoordinatorChange: (text: string) => void;
  filterFollowUp: boolean;
  onFilterFollowUpChange: (val: boolean) => void;
}

export default function IncidentFilters({
  searchText, onSearchChange,
  filterType, onFilterTypeChange,
  filterUrgency, onFilterUrgencyChange,
  filterCoordinator, onFilterCoordinatorChange,
  filterFollowUp, onFilterFollowUpChange,
}: IncidentFiltersProps) {
  return (
    <>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por professor, descrição ou solução..."
          className="w-full pl-9 pr-3 py-2 bg-input text-body text-foreground rounded-md focus:ring-2 ring-ring outline-none transition-all placeholder:text-muted-foreground"
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 mr-2">
          <span className="label-text">Tipo:</span>
          <div className="flex gap-1">
            {(["Todos", ...PROBLEM_TYPES] as const).map((type) => (
              <button
                key={type}
                onClick={() => onFilterTypeChange(type)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  filterType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="label-text">Urgência:</span>
          <div className="flex gap-1">
            {(["Todas", ...URGENCY_LEVELS] as const).map((level) => (
              <button
                key={level}
                onClick={() => onFilterUrgencyChange(level)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  filterUrgency === level
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="label-text">Responsável:</span>
          <input
            type="text"
            value={filterCoordinator}
            onChange={(e) => onFilterCoordinatorChange(e.target.value)}
            placeholder="Filtrar..."
            className="px-2.5 py-1 text-xs bg-input text-foreground rounded-md focus:ring-2 ring-ring outline-none transition-all placeholder:text-muted-foreground w-32"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onFilterFollowUpChange(!filterFollowUp)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              filterFollowUp
                ? "bg-urgency-medium text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            🔔 Acompanhamento pendente
          </button>
        </div>
      </div>
    </>
  );
}
