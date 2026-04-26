import { useState, useMemo, useEffect } from "react";
import { Incident } from "@/lib/types";
import { AlertTriangle, Clock, TrendingUp, CheckCircle, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StatsCardsProps {
  incidents: Incident[];
  activeTab: "active" | "resolved" | "interno" | "resolvedCI";
  onPeriodFilterChange?: (filtered: Incident[]) => void;
}

type PeriodMode = "today" | "month" | "semester" | "year";

export default function StatsCards({ incidents, activeTab, onPeriodFilterChange }: StatsCardsProps) {
  const [periodMode, setPeriodMode] = useState<PeriodMode>("today");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedSemester, setSelectedSemester] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), semester: now.getMonth() < 6 ? 1 : 2 };
  });

  const periodFiltered = useMemo(() => {
    if (periodMode === "today") {
      const today = new Date();
      return incidents.filter(
        (i) => i.createdAt.toDateString() === today.toDateString()
      );
    }
    if (periodMode === "month") {
      return incidents.filter((i) => {
        return (
          i.createdAt.getFullYear() === selectedMonth.year &&
          i.createdAt.getMonth() === selectedMonth.month
        );
      });
    }
    if (periodMode === "semester") {
      return incidents.filter((i) => {
        const m = i.createdAt.getMonth();
        const sem = m < 6 ? 1 : 2;
        return (
          i.createdAt.getFullYear() === selectedSemester.year &&
          sem === selectedSemester.semester
        );
      });
    }
    return incidents.filter((i) => i.createdAt.getFullYear() === selectedYear);
  }, [incidents, periodMode, selectedMonth, selectedSemester, selectedYear]);

  const periodCount = periodFiltered.length;

  useEffect(() => {
    onPeriodFilterChange?.(periodFiltered);
  }, [periodFiltered, onPeriodFilterChange]);

  const analysisLabel = activeTab === "interno" ? "% em Análise" : "% Plataforma";
  const analysisType = activeTab === "interno" ? "Mês de análise" : "Plataforma";
  const analysisCount = periodFiltered.filter((i) => i.problemType === analysisType).length;
  const analysisPercent = periodFiltered.length > 0 ? Math.round((analysisCount / periodFiltered.length) * 100) : 0;

  const pendingCount = incidents.filter((i) => !i.resolved).length;
  const resolvedCount = incidents.filter((i) => i.resolved).length;
  const tabIncidents = incidents.filter((i) => activeTab === "active" ? !i.resolved : i.resolved);
  const highUrgency = tabIncidents.filter((i) => i.urgency === "Alta").length;

  const handlePrev = () => {
    if (periodMode === "month") {
      setSelectedMonth((prev) => {
        if (prev.month === 0) return { year: prev.year - 1, month: 11 };
        return { ...prev, month: prev.month - 1 };
      });
    } else if (periodMode === "semester") {
      setSelectedSemester((prev) => {
        if (prev.semester === 1) return { year: prev.year - 1, semester: 2 };
        return { ...prev, semester: 1 };
      });
    } else if (periodMode === "year") {
      setSelectedYear((y) => y - 1);
    }
  };

  const handleNext = () => {
    if (periodMode === "month") {
      setSelectedMonth((prev) => {
        if (prev.month === 11) return { year: prev.year + 1, month: 0 };
        return { ...prev, month: prev.month + 1 };
      });
    } else if (periodMode === "semester") {
      setSelectedSemester((prev) => {
        if (prev.semester === 2) return { year: prev.year + 1, semester: 1 };
        return { ...prev, semester: 2 };
      });
    } else if (periodMode === "year") {
      setSelectedYear((y) => y + 1);
    }
  };

  const monthLabel = format(
    new Date(selectedMonth.year, selectedMonth.month),
    "MMM/yy",
    { locale: ptBR }
  );
  const semesterLabel = `${selectedSemester.semester}º sem/${String(selectedSemester.year).slice(-2)}`;
  const yearLabel = String(selectedYear);

  const navLabel =
    periodMode === "month"
      ? monthLabel
      : periodMode === "semester"
      ? semesterLabel
      : yearLabel;

  const totalLabel =
    periodMode === "today"
      ? "Total Hoje"
      : periodMode === "month"
      ? "Total Mês"
      : periodMode === "semester"
      ? "Total Semestre"
      : "Total Ano";

  const modes: { key: PeriodMode; label: string }[] = [
    { key: "today", label: "Hoje" },
    { key: "month", label: "Mês" },
    { key: "semester", label: "Sem" },
    { key: "year", label: "Ano" },
  ];

  const stats = [
    { label: analysisLabel, value: `${analysisPercent}%`, icon: Clock },
    { label: "Pendentes", value: pendingCount, icon: AlertTriangle },
    { label: "Resolvidos", value: resolvedCount, icon: CheckCircle },
    { label: "Urgentes", value: highUrgency, icon: AlertTriangle, highlight: highUrgency > 0 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {/* Period card with toggle */}
      <div className="bg-card rounded-lg shadow-card p-4">
        <div className="flex items-center gap-1.5 mb-1">
          {periodMode === "today" ? (
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          <div className="flex items-center gap-0.5 ml-auto flex-wrap justify-end">
            {modes.map((m) => (
              <button
                key={m.key}
                onClick={() => setPeriodMode(m.key)}
                className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                  periodMode === m.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {periodMode !== "today" && (
          <div className="flex items-center justify-between mb-1">
            <button onClick={handlePrev} className="p-0.5 rounded hover:bg-muted transition-colors">
              <ChevronLeft className="w-3 h-3 text-muted-foreground" />
            </button>
            <span className="text-[10px] font-medium text-muted-foreground capitalize">{navLabel}</span>
            <button onClick={handleNext} className="p-0.5 rounded hover:bg-muted transition-colors">
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        )}

        <p className="text-2xl font-bold tabular-nums text-foreground">{periodCount}</p>
        <span className="label-text">{totalLabel}</span>
      </div>

      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`bg-card rounded-lg shadow-card p-4 ${
            stat.highlight ? "ring-1 ring-urgency-high/20" : ""
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <stat.icon className={`w-3.5 h-3.5 ${stat.highlight ? "text-urgency-high" : "text-muted-foreground"}`} />
            <span className="label-text">{stat.label}</span>
          </div>
          <p className={`text-2xl font-bold tabular-nums ${stat.highlight ? "text-urgency-high" : "text-foreground"}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
