/**
 * Calendar helpers for win streaks (aligned with puzzle_date YYYY-MM-DD).
 */

/** Returns the previous calendar day in UTC for a YYYY-MM-DD string */
export function calendarDayBefore(puzzleDate: string): string {
  const parts = puzzleDate.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d) {
    throw new Error(`Invalid puzzleDate: ${puzzleDate}`);
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().split("T")[0];
}
