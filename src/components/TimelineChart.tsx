import { useMemo, useState } from "react";
import { Incident } from "@/lib/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { startOfWeek, startOfMonth, format, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimelineChartProps {
  incidents: Incident[];
}

type Granularity = "week" | "month";

export default function TimelineChart({ incidents }: TimelineChartProps) {
  const [granularity, setGranularity] = useState<Granularity>("week");

  const data = useMemo(() => {
    if (incidents.length === 0) return [];

    const dates = incidents.map((i) => i.createdAt);
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    if (granularity === "week") {
      const weeks = eachWeekOfInterval({ start: minDate, end: maxDate }, { weekStartsOn: 1 });
      return weeks.map((weekStart) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const count = incidents.filter((i) => {
          const d = i.createdAt;
          return d >= weekStart && d < weekEnd;
        }).length;
        return {
          label: format(weekStart, "dd/MM", { locale: ptBR }),
          count,
        };
      });
    } else {
      const months = eachMonthOfInterval({ start: startOfMonth(minDate), end: startOfMonth(maxDate) });
      return months.map((monthStart) => {
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        const count = incidents.filter((i) => {
          const d = i.createdAt;
          return d >= monthStart && d < monthEnd;
        }).length;
        return {
          label: format(monthStart, "MMM/yy", { locale: ptBR }),
          count,
        };
      });
    }
  }, [incidents, granularity]);

  return (
    <div className="bg-card rounded-lg shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="label-text">Evolução temporal</h3>
        <div className="flex rounded-md bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setGranularity("week")}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-sm transition-all ${
              granularity === "week"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Semana
          </button>
          <button
            type="button"
            onClick={() => setGranularity("month")}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-sm transition-all ${
              granularity === "month"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Mês
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum dado disponível.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: number) => [value, "Incidentes"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorCount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
