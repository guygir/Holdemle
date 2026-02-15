/**
 * List all saved games for each user.
 * Run: npx tsx scripts/list-user-games.ts
 * Requires: .env.local with Supabase credentials
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createAdminClient } from "../lib/supabase/admin";

type Guess = {
  id: string;
  user_id: string;
  puzzle_id: string;
  guesses_used: number;
  is_solved: boolean;
  time_taken_seconds: number;
  total_score: number;
  percent_diff: number;
  submitted_at: string;
};

async function main() {
  const supabase = createAdminClient();

  const { data: guesses, error: guessesError } = await supabase
    .from("guesses")
    .select("id, user_id, puzzle_id, guesses_used, is_solved, time_taken_seconds, total_score, percent_diff, submitted_at")
    .order("submitted_at", { ascending: false });

  if (guessesError) {
    console.error("Error fetching guesses:", guessesError.message);
    process.exit(1);
  }

  const puzzleIds = [...new Set((guesses ?? []).map((g) => g.puzzle_id))];
  const userIds = [...new Set((guesses ?? []).map((g) => g.user_id))];

  const { data: puzzles } = puzzleIds.length
    ? await supabase.from("puzzles").select("id, puzzle_date").in("id", puzzleIds)
    : { data: [] };
  const puzzleMap = Object.fromEntries((puzzles ?? []).map((p) => [p.id, p.puzzle_date]));

  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("user_id, nickname").in("user_id", userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p.nickname]));

  console.log(`\nTotal saved games: ${guesses?.length ?? 0}\n`);

  const byUser = new Map<string, Guess[]>();
  for (const g of guesses ?? []) {
    const list = byUser.get(g.user_id) ?? [];
    list.push(g);
    byUser.set(g.user_id, list);
  }

  for (const [userId, userGuesses] of byUser) {
    const nickname = profileMap[userId] ?? "(unknown)";
    console.log(`\n--- ${nickname} (${userId.slice(0, 8)}...) ---`);
    console.log(`   Games: ${userGuesses.length}\n`);

    for (const g of userGuesses) {
      const date = puzzleMap[g.puzzle_id] ?? "?";
      const result = g.is_solved ? "WON" : "LOSS";
      const time = `${Math.floor(g.time_taken_seconds / 60)}:${String(g.time_taken_seconds % 60).padStart(2, "0")}`;
      console.log(`   ${date} | ${result} | ${g.guesses_used}/5 guesses | ${time} | Score: ${g.total_score} | Δ${g.percent_diff}%`);
    }
  }
}

main();
