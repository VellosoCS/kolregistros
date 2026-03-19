import { useState, useMemo } from "react";
import { Incident } from "@/lib/types";
import { AlertTriangle, Clock, TrendingUp, CheckCircle, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StatsCardsProps {
  incidents: Incident[];
  activeTab: "active" | "resolved";
}

type PeriodMode = "today" | "month";

export default function StatsCards({ incidents, activeTab }: StatsCardsProps) {
  const [periodMode, setPeriodMode] = useState<PeriodMode>("today");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const periodCount = useMemo(() => {
    if (periodMode === "today") {
      const today = new Date();
      return incidents.filter(
        (i) => i.createdAt.toDateString() === today.toDateString()
      ).length;
    }
    return incidents.filter((i) => {
      return (
        i.createdAt.getFullYear() === selectedMonth.year &&
        i.createdAt.getMonth() === selectedMonth.month
      );
    }).length;
  }, [incidents, periodMode, selectedMonth]);

  const platformCount = incidents.filter((i) => i.problemType === "Plataforma").length;
  const platformPercent = incidents.length > 0 ? Math.round((platformCount / incidents.length) * 100) : 0;

  const pendingCount = incidents.filter((i) => !i.resolved).length;
  const resolvedCount = incidents.filter((i) => i.resolved).length;
  const tabIncidents = incidents.filter((i) => activeTab === "active" ? !i.resolved : i.resolved);
  const highUrgency = tabIncidents.filter((i) => i.urgency === "Alta").length;

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const monthLabel = format(
    new Date(selectedMonth.year, selectedMonth.month),
    "MMM/yy",
    { locale: ptBR }
  );

  const stats = [
    { label: "% Plataforma", value: `${platformPercent}%`, icon: Clock },
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
          <div className="flex items-center gap-0.5 ml-auto">
            <button
              onClick={() => { setPeriodMode("today"); }}
              className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                periodMode === "today"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => { setPeriodMode("month"); }}
              className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                periodMode === "month"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Mês
            </button>
          </div>
        </div>

        {periodMode === "month" && (
          <div className="flex items-center justify-between mb-1">
            <button onClick={handlePrevMonth} className="p-0.5 rounded hover:bg-muted transition-colors">
              <ChevronLeft className="w-3 h-3 text-muted-foreground" />
            </button>
            <span className="text-[10px] font-medium text-muted-foreground capitalize">{monthLabel}</span>
            <button onClick={handleNextMonth} className="p-0.5 rounded hover:bg-muted transition-colors">
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        )}

        <p className="text-2xl font-bold tabular-nums text-foreground">{periodCount}</p>
        <span className="label-text">
          {periodMode === "today" ? "Total Hoje" : "Total Mês"}
        </span>
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
