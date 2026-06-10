export interface RecurrenceStyle {
  label: string;
  badgeClass: string;
  rowClass: string;
  tone: "none" | "warning" | "elevated" | "critical";
}

export function getRecurrenceStyle(count: number | null | undefined): RecurrenceStyle {
  const n = count ?? 0;
  if (n <= 0) {
    return { label: "", badgeClass: "", rowClass: "", tone: "none" };
  }
  if (n === 1) {
    return {
      label: `Reincidente 1x`,
      badgeClass: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30",
      rowClass: "",
      tone: "warning",
    };
  }
  if (n === 2) {
    return {
      label: `Reincidente 2x`,
      badgeClass: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30",
      rowClass: "",
      tone: "elevated",
    };
  }
  return {
    label: `Reincidente ${n}x`,
    badgeClass: "bg-urgency-high/20 text-urgency-high border border-urgency-high/40",
    rowClass: "bg-urgency-high/5 border-l-4 border-l-urgency-high",
    tone: "critical",
  };
}
