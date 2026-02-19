/**
 * Debug script: replicate daily-plays API logic and print exact values.
 * Run: npx tsx scripts/debug-daily-plays.ts
 */

import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  console.log("=== Daily plays debug ===\n");
  console.log("UTC today:", today);
  console.log("");

  const { data: puzzles, error: puzzlesErr } = await supabase
    .from("puzzles")
    .select("id, puzzle_date")
    .lte("puzzle_date", today)
    .order("puzzle_date", { ascending: true });

  if (puzzlesErr) {
    console.error("Puzzles error:", puzzlesErr);
    return;
  }
  if (!puzzles || puzzles.length === 0) {
    console.log("No puzzles found");
    return;
  }

  const puzzleIds = puzzles.map((p) => p.id);

  const { data: guesses, error: guessesErr } = await supabase
    .from("guesses")
    .select("id, puzzle_id, user_id, guesses_used, is_solved")
    .in("puzzle_id", puzzleIds)
    .gt("guesses_used", 0);

  if (guessesErr) {
    console.error("Guesses error:", guessesErr);
    return;
  }

  const playsByPuzzleId = new Map<string, number>();
  const completedByPuzzleId = new Map<string, number>();
  const MAX_GUESSES = 5;

  for (const g of guesses ?? []) {
    const prev = playsByPuzzleId.get(g.puzzle_id) ?? 0;
    playsByPuzzleId.set(g.puzzle_id, prev + 1);

    const isCompleted = g.is_solved || (g.guesses_used ?? 0) >= MAX_GUESSES;
    if (isCompleted) {
      const prevCompleted = completedByPuzzleId.get(g.puzzle_id) ?? 0;
      completedByPuzzleId.set(g.puzzle_id, prevCompleted + 1);
    }
  }

  // Last 5 puzzles (including "today")
  const lastPuzzles = puzzles.slice(-5);
  console.log("Last 5 puzzle dates and counts:\n");
  for (const p of lastPuzzles) {
    const plays = playsByPuzzleId.get(p.id) ?? 0;
    const completed = completedByPuzzleId.get(p.id) ?? 0;
    const inProgress = plays - completed;
    console.log(
      `  ${p.puzzle_date} (id: ${p.id.slice(0, 8)}...) | plays: ${plays} | completed: ${completed} | in-progress: ${inProgress}`
    );
  }

  const lastPuzzle = puzzles[puzzles.length - 1];
  const lastPlays = playsByPuzzleId.get(lastPuzzle.id) ?? 0;
  const lastCompleted = completedByPuzzleId.get(lastPuzzle.id) ?? 0;

  console.log("\n--- Today's puzzle (last point on graph) ---");
  console.log("  Date:", lastPuzzle.puzzle_date);
  console.log("  Graph value (plays):", lastPlays);
  console.log("  Leaderboard (completed):", lastCompleted);
  console.log("  Difference:", lastPlays - lastCompleted);

  // List all guess rows for today's puzzle
  const todayGuesses = (guesses ?? []).filter((g) => g.puzzle_id === lastPuzzle.id);
  console.log("\n  All guess rows for today:", todayGuesses.length);
  if (todayGuesses.length <= 25) {
    for (const g of todayGuesses) {
      const completed = g.is_solved || (g.guesses_used ?? 0) >= MAX_GUESSES;
      console.log(
        `    user ${g.user_id.slice(0, 8)}... guesses_used=${g.guesses_used} is_solved=${g.is_solved} => ${completed ? "completed" : "in-progress"}`
      );
    }
  }
}

main().catch(console.error);
