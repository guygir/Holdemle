/**
 * Cleanup for launch:
 * 1. Delete test accounts (profiles + auth users + their guesses cascade)
 * 2. For remaining users, delete guesses for puzzles NOT from today
 * 3. Recalculate user_stats for kept users from remaining guesses
 *
 * Run: npx tsx scripts/cleanup-for-launch.ts
 * Requires: .env.local with Supabase credentials
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createAdminClient } from "../lib/supabase/admin";
import {
  incrementSolved,
  getAverageGuessesFromSolvedDistribution,
  countWins,
} from "../lib/utils/solved-distribution";
import { sortDailyLeaderboard } from "../lib/utils/leaderboard-sort";

const TEST_NICKNAMES = ["slopke", "guygir_2", "num2", "num3", "asfasdfa", "sdlgkjsdlkgj"];
const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  if (DRY_RUN) console.log("*** DRY RUN - no changes will be made ***\n");
  const supabase = createAdminClient();

  // Use calendar date (UTC) to match puzzle_date storage
  const today = new Date().toISOString().split("T")[0];
  console.log("Keeping only games from:", today, "\n");

  // 1. Get profiles to find user_ids for test accounts
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, nickname");

  const profilesList = profiles ?? [];
  const testUserIds = profilesList
    .filter((p) => TEST_NICKNAMES.includes(p.nickname.toLowerCase()))
    .map((p) => p.user_id);

  const keepUserIds = profilesList
    .filter((p) => !TEST_NICKNAMES.includes(p.nickname.toLowerCase()))
    .map((p) => p.user_id);

  console.log("Test accounts to delete:", testUserIds.length);
  for (const p of profilesList.filter((x) => TEST_NICKNAMES.includes(x.nickname.toLowerCase()))) {
    console.log("  -", p.nickname, p.user_id);
  }

  // 2. Delete test users from auth (cascades to profiles + guesses)
  if (!DRY_RUN) {
    for (const userId of testUserIds) {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        console.error("Failed to delete user:", userId, error.message);
      } else {
        console.log("Deleted user:", userId);
      }
    }
  } else {
    console.log("Would delete", testUserIds.length, "test users");
  }

  // 3. Get today's puzzle IDs
  const { data: todayPuzzles } = await supabase
    .from("puzzles")
    .select("id")
    .eq("puzzle_date", today);
  const todayPuzzleIds = (todayPuzzles ?? []).map((p) => p.id);

  if (todayPuzzleIds.length === 0) {
    console.log("\nNo puzzle for today - skipping guess cleanup");
    return;
  }

  // 4. Get all guesses for kept users that reference non-today puzzles
  const { data: allGuesses } = await supabase
    .from("guesses")
    .select("id, user_id, puzzle_id")
    .in("user_id", keepUserIds);

  const { data: allPuzzles } = await supabase
    .from("puzzles")
    .select("id, puzzle_date");

  const puzzleDateMap = Object.fromEntries((allPuzzles ?? []).map((p) => [p.id, p.puzzle_date]));

  const toDelete = (allGuesses ?? []).filter(
    (g) => !todayPuzzleIds.includes(g.puzzle_id)
  );

  console.log("\nGuesses to delete (not from today):", toDelete.length);
  for (const g of toDelete) {
    const date = puzzleDateMap[g.puzzle_id] ?? "?";
    const nick = profilesList.find((p) => p.user_id === g.user_id)?.nickname ?? "?";
    console.log("  -", nick, date, g.id);
  }

  if (!DRY_RUN) {
    for (const g of toDelete) {
      const { error } = await supabase.from("guesses").delete().eq("id", g.id);
      if (error) {
        console.error("Failed to delete guess:", g.id, error.message);
      } else {
        console.log("Deleted guess:", g.id);
      }
    }
  } else {
    console.log("Would delete", toDelete.length, "old guesses");
  }

  // 5. Recalculate user_stats for kept users from remaining guesses (only if not dry-run)
  const { data: remainingGuesses } = await supabase
    .from("guesses")
    .select("user_id, guesses_used, is_solved, total_score, percent_diff, puzzle_id")
    .in("user_id", keepUserIds);

  const { data: puzzleDates } = await supabase
    .from("puzzles")
    .select("id, puzzle_date");
  const pidToDate = Object.fromEntries((puzzleDates ?? []).map((p) => [p.id, p.puzzle_date]));

  const guessesByUser = new Map<string, typeof remainingGuesses>();
  for (const g of remainingGuesses ?? []) {
    const list = guessesByUser.get(g.user_id) ?? [];
    list.push(g);
    guessesByUser.set(g.user_id, list);
  }

  if (DRY_RUN) {
    console.log("Would recalc stats for", keepUserIds.length, "kept users");
  } else {
    for (const userId of keepUserIds) {
      const userGuesses = guessesByUser.get(userId) ?? [];
      if (userGuesses.length === 0) {
        await supabase.from("user_stats").delete().eq("user_id", userId);
        console.log("Cleared stats for user (no guesses left):", userId);
        continue;
      }

      // Sort by puzzle_date for correct streak calculation
      const sorted = [...userGuesses].sort(
        (a, b) =>
          (pidToDate[a.puzzle_id] ?? "").localeCompare(pidToDate[b.puzzle_id] ?? "")
      );

      let solvedDist: Record<string, number> = {};
      let failedGames = 0;
      let totalScore = 0;
      let totalPercentDiff = 0;
      let lastDate = "";
      let currentStreak = 0;
      let maxStreak = 0;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      for (const g of sorted) {
        const d = pidToDate[g.puzzle_id] ?? "";
        if (g.is_solved) {
          solvedDist = incrementSolved(solvedDist, g.guesses_used);
          currentStreak = lastDate === yesterdayStr ? currentStreak + 1 : 1;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          failedGames++;
          currentStreak = 0;
        }
        totalScore += g.total_score ?? 0;
        totalPercentDiff += g.percent_diff ?? 0;
        if (d) lastDate = d;
      }

      const totalGames = sorted.length;
      await supabase.from("user_stats").upsert(
        {
          user_id: userId,
          total_games: totalGames,
          solved_distribution: solvedDist,
          failed_games: failedGames,
          total_score: totalScore,
          average_guesses: getAverageGuessesFromSolvedDistribution(solvedDist),
          average_percent_diff: totalGames > 0 ? totalPercentDiff / totalGames : 0,
          last_played_date: lastDate || null,
          current_streak: currentStreak,
          max_streak: maxStreak,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      console.log("Updated stats for:", profilesList.find((p) => p.user_id === userId)?.nickname ?? userId);
    }
  }

  // 6. Verify: print what daily leaderboard + all-time leaderboard would show
  if (!DRY_RUN) {
    console.log("\n--- Verification ---");
    const { data: todayPuzzle } = await supabase
      .from("puzzles")
      .select("id")
      .eq("puzzle_date", today)
      .single();
    if (todayPuzzle) {
      const { data: dailyGuesses } = await supabase
        .from("guesses")
        .select("user_id, is_solved, guesses_used, time_taken_seconds, percent_diff")
        .eq("puzzle_id", todayPuzzle.id);
      const completed = (dailyGuesses ?? []).filter((g) => g.guesses_used > 0);
      const sortedDaily = sortDailyLeaderboard(completed);
      const dailyUserIds = sortedDaily.map((g) => g.user_id);
      const { data: dailyProfiles } = dailyUserIds.length
        ? await supabase.from("profiles").select("user_id, nickname").in("user_id", dailyUserIds)
        : { data: [] };
      const nickMap = new Map((dailyProfiles ?? []).map((p) => [p.user_id, p.nickname]));
      console.log("Daily leaderboard:", sortedDaily.length, "entries");
      sortedDaily.slice(0, 5).forEach((g, i) => {
        const nick = nickMap.get(g.user_id) ?? g.user_id.slice(0, 8);
        console.log(`  #${i + 1}`, nick, g.is_solved ? "WON" : "LOSS", `${g.guesses_used}/5`);
      });
    }
    const { data: stats } = await supabase.from("user_stats").select("user_id, total_games, solved_distribution, failed_games").gt("total_games", 0);
    const profileMap = new Map(profilesList.map((p) => [p.user_id, p.nickname]));
    const alltimeSorted = (stats ?? []).sort((a, b) => {
      const winsA = countWins(a.solved_distribution);
      const winsB = countWins(b.solved_distribution);
      if (winsB !== winsA) return winsB - winsA;
      const avgA = getAverageGuessesFromSolvedDistribution(a.solved_distribution) || 999;
      const avgB = getAverageGuessesFromSolvedDistribution(b.solved_distribution) || 999;
      return avgA - avgB;
    });
    console.log("All-time leaderboard:", alltimeSorted.length, "entries");
    alltimeSorted.slice(0, 5).forEach((s, i) => {
      const nick = profileMap.get(s.user_id) ?? s.user_id.slice(0, 8);
      const wins = countWins(s.solved_distribution);
      console.log(`  #${i + 1}`, nick, wins, "wins /", s.total_games, "games");
    });
  }

  console.log("\nDone.");
}

main();
