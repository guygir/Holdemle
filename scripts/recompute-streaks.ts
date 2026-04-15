/**
 * One-off: recompute current_streak, max_streak, and last_played_date from guesses
 * + puzzles, using the same calendar-day rules as updateUserStats (calendarDayBefore).
 *
 * Only touches streak-related columns on existing user_stats rows.
 *
 * Run: npx tsx scripts/recompute-streaks.ts [--dry-run]
 * Requires: .env.local with Supabase service role
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createAdminClient } from "../lib/supabase/admin";
import { calendarDayBefore } from "../lib/streak";
import { MAX_GUESSES } from "../lib/game-config";

const DRY_RUN = process.argv.includes("--dry-run");

function isCompleted(g: { is_solved: boolean; guesses_used: number }) {
  return g.is_solved || g.guesses_used >= MAX_GUESSES;
}

function replayStreaks(
  rows: Array<{ puzzle_date: string; is_solved: boolean }>
): { currentStreak: number; maxStreak: number; lastPlayedDate: string | null } {
  let lastPlayed = "";
  let currentStreak = 0;
  let maxStreak = 0;
  for (const g of rows) {
    const d = g.puzzle_date;
    if (g.is_solved) {
      if (lastPlayed === calendarDayBefore(d)) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
    lastPlayed = d;
  }
  return {
    currentStreak,
    maxStreak,
    lastPlayedDate: lastPlayed || null,
  };
}

async function main() {
  if (DRY_RUN) console.log("*** DRY RUN — no DB writes ***\n");
  const supabase = createAdminClient();

  const { data: puzzles, error: pErr } = await supabase
    .from("puzzles")
    .select("id, puzzle_date");
  if (pErr) throw pErr;
  const pidToDate = Object.fromEntries((puzzles ?? []).map((p) => [p.id, p.puzzle_date]));

  const { data: guesses, error: gErr } = await supabase
    .from("guesses")
    .select("user_id, puzzle_id, is_solved, guesses_used");
  if (gErr) throw gErr;

  // UNIQUE(user_id, puzzle_id) — one row per game; keep highest guesses_used if duplicates exist
  const byKey = new Map<string, (typeof guesses)[number]>();
  for (const g of guesses ?? []) {
    if (!isCompleted(g)) continue;
    const d = pidToDate[g.puzzle_id];
    if (!d) continue;
    const key = `${g.user_id}:${g.puzzle_id}`;
    const prev = byKey.get(key);
    if (!prev || g.guesses_used > prev.guesses_used) {
      byKey.set(key, g);
    }
  }

  const byUser = new Map<
    string,
    Array<{ puzzle_date: string; is_solved: boolean; puzzle_id: string }>
  >();
  for (const g of byKey.values()) {
    const d = pidToDate[g.puzzle_id];
    if (!d) continue;
    const list = byUser.get(g.user_id) ?? [];
    list.push({
      puzzle_date: d,
      is_solved: g.is_solved,
      puzzle_id: g.puzzle_id,
    });
    byUser.set(g.user_id, list);
  }

  let updated = 0;
  let skipped = 0;

  for (const [userId, list] of byUser) {
    const sorted = [...list].sort((a, b) => {
      const cmp = a.puzzle_date.localeCompare(b.puzzle_date);
      if (cmp !== 0) return cmp;
      return a.puzzle_id.localeCompare(b.puzzle_id);
    });

    const { currentStreak, maxStreak, lastPlayedDate } = replayStreaks(sorted);

    if (DRY_RUN) {
      console.log(
        userId.slice(0, 8),
        "current",
        currentStreak,
        "max",
        maxStreak,
        "last",
        lastPlayedDate
      );
      updated++;
      continue;
    }

    const { data: existing, error: selErr } = await supabase
      .from("user_stats")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (selErr) {
      console.error("select user_stats", userId, selErr.message);
      continue;
    }
    if (!existing) {
      skipped++;
      continue;
    }

    const { error: upErr } = await supabase
      .from("user_stats")
      .update({
        current_streak: currentStreak,
        max_streak: maxStreak,
        last_played_date: lastPlayedDate,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (upErr) {
      console.error("update failed", userId, upErr.message);
    } else {
      updated++;
    }
  }

  console.log(
    DRY_RUN
      ? `Dry run: ${updated} users would be written.`
      : `Updated ${updated} user_stats rows.` + (skipped ? ` Skipped ${skipped} (no user_stats row).` : "")
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
