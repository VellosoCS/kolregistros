import { Incident } from "@/lib/types";
import { AlertTriangle, Clock, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  incidents: Incident[];
}

export default function StatsCards({ incidents }: StatsCardsProps) {
  const today = new Date();
  const todayCount = incidents.filter(
    (i) => i.createdAt.toDateString() === today.toDateString()
  ).length;

  const platformCount = incidents.filter((i) => i.problemType === "Plataforma").length;
  const platformPercent = incidents.length > 0 ? Math.round((platformCount / incidents.length) * 100) : 0;

  const pendingCount = incidents.filter((i) => i.needsFollowUp).length;

  const highUrgency = incidents.filter(
    (i) => i.urgency === "Alta" && i.createdAt.toDateString() === today.toDateString()
  ).length;

  const stats = [
    { label: "Total Hoje", value: todayCount, icon: TrendingUp },
    { label: "% Plataforma", value: `${platformPercent}%`, icon: Clock },
    { label: "Pendentes", value: pendingCount, icon: AlertTriangle },
    { label: "Urgentes Hoje", value: highUrgency, icon: AlertTriangle, highlight: highUrgency > 0 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
