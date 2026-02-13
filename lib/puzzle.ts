import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns the most recent puzzle_date that exists in the DB, where puzzle_date <= today.
 * Before the daily cron runs, this may return yesterday's date.
 */
export async function getCurrentPuzzleDate(
  supabase: SupabaseClient
): Promise<string | null> {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("puzzles")
    .select("puzzle_date")
    .lte("puzzle_date", today)
    .order("puzzle_date", { ascending: false })
    .limit(1);
  const row = Array.isArray(data) ? data[0] : data;
  return row?.puzzle_date ?? null;
}
