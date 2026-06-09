// Single source of truth for date rules shared across the app.
// All "today"/"now" derivations are pinned to APP_TZ so users in different
// timezones see the same predicted dates and overdue state as the database.
//
// Date columns (YYYY-MM-DD) are timezone-agnostic strings — the rules below
// only normalize them on parse/format. The SQL mirror lives in
// public.last_week_of_month(date).

import { z } from "zod";

export const APP_TZ = "America/Sao_Paulo";

/**
 * Zod schema enforcing strict YYYY-MM-DD (date-only, no time, no TZ).
 * Use before sending any date value to the database.
 */
export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: "Data inválida: use o formato YYYY-MM-DD (sem hora/fuso).",
  })
  .refine(
    (s) => {
      const [y, m, d] = s.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
    },
    { message: "Data inexistente no calendário." },
  );

export const nullableDateOnlySchema = dateOnlySchema.nullable();

/** Throws if `value` is not a valid date-only string (null is allowed). */
export function assertDateOnly(value: unknown, field = "date"): asserts value is string | null {
  if (value === null || value === undefined) return;
  const r = dateOnlySchema.safeParse(value);
  if (!r.success) {
    throw new Error(`Campo "${field}" inválido: ${r.error.issues[0]?.message ?? "formato esperado YYYY-MM-DD"}`);
  }
}


function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Local date parts of `d` in APP_TZ (year/month/day as numbers). */
function partsInAppTZ(d: Date): { y: number; m: number; d: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA -> "YYYY-MM-DD"
  const [y, m, day] = fmt.format(d).split("-").map(Number);
  return { y, m, d: day };
}

/** Format a Date as YYYY-MM-DD using the calendar day in APP_TZ. */
export function toDateInput(d: Date): string {
  const { y, m, d: day } = partsInAppTZ(d);
  return `${y}-${pad(m)}-${pad(day)}`;
}

/** "Today" as a YYYY-MM-DD string in APP_TZ. */
export function todayISO(): string {
  return toDateInput(new Date());
}

/**
 * Parse a YYYY-MM-DD into a Date anchored at local midnight, with the same
 * calendar day in every browser. Use only for display/formatting — never for
 * timezone-sensitive comparisons (use the ISO string helpers for those).
 */
export function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * "Última semana do mês" = Monday of the week containing the last day of the
 * month of `ref` (interpreted in APP_TZ). Mirrors public.last_week_of_month.
 */
export function lastWeekOfMonth(ref: Date): Date {
  const { y, m } = partsInAppTZ(ref);
  // Last day of that month (m is 1-based here; using day 0 of next month).
  const lastDay = new Date(y, m, 0);
  const isoDow = lastDay.getDay() === 0 ? 7 : lastDay.getDay();
  const monday = new Date(lastDay);
  monday.setDate(lastDay.getDate() - (isoDow - 1));
  return monday;
}

export function lastWeekOfMonthISO(ref: Date): string {
  const d = lastWeekOfMonth(ref);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** True when `iso` (YYYY-MM-DD) is today or earlier in APP_TZ. */
export function isOnOrBeforeToday(iso: string): boolean {
  return iso <= todayISO();
}
