// Single source of truth for date rules shared across the app.
// Mirror of the SQL function public.last_week_of_month(date).

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * "Última semana do mês" = Monday of the week that contains the last day of the month.
 * Matches the SQL function public.last_week_of_month so the value displayed in the UI
 * is always consistent with the one computed by the database trigger.
 */
export function lastWeekOfMonth(ref: Date): Date {
  const lastDay = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  // JS getDay(): 0=Sun..6=Sat. ISO dow: 1=Mon..7=Sun.
  const isoDow = lastDay.getDay() === 0 ? 7 : lastDay.getDay();
  const monday = new Date(lastDay);
  monday.setDate(lastDay.getDate() - (isoDow - 1));
  return monday;
}

export function lastWeekOfMonthISO(ref: Date): string {
  return toDateInput(lastWeekOfMonth(ref));
}
