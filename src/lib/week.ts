// ISO-week string, e.g. "2026-W24". Used as the People's Choice vote cycle key,
// derived from now() at write time so the cycle resets weekly with no cron.
export function isoWeek(date = new Date()): string {
  // Copy and shift to Thursday of this week — ISO weeks are defined by their Thursday.
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Sunday = 7
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
