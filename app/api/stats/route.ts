import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUseDemo } from "@/lib/demo-mode";
import {
  getAverageGuessesFromSolvedDistribution,
  getAverageGuessesIncludingLosses,
} from "@/lib/utils/solved-distribution";
import { MAX_GUESSES } from "@/lib/game-config";

export async function GET() {
  const useDemo = getUseDemo();
  if (useDemo === "fail") {
    return NextResponse.json(
      {
        success: false,
        error: "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and related env vars.",
      },
      { status: 503 }
    );
  }
  if (useDemo) {
    return NextResponse.json({
      success: true,
      data: {
        totalGames: 0,
        solvedDistribution: {} as Record<string, number>,
        failedGames: 0,
        currentStreak: 0,
        maxStreak: 0,
        averageGuesses: 0,
        averageGuessesIncludingLosses: 0,
        winPercent: 0,
        averagePercentDiff: 0,
        lastPlayedDate: null,
        recentGames: [],
      },
    });
  }

  const supabase = await createServerSupabaseClient();
  const user = (await supabase.auth.getUser()).data.user;

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const { data: stats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: recentGuesses } = await supabase
    .from("guesses")
    .select("puzzle_id, guesses_used, is_solved, time_taken_seconds, percent_diff, submitted_at")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(10);

  const completedGuesses = (recentGuesses ?? []).filter((g) => g.guesses_used > 0);
  const puzzleIds = [...new Set(completedGuesses.map((g) => g.puzzle_id))];
  const { data: puzzles } = puzzleIds.length
    ? await supabase
        .from("puzzles")
        .select("id, puzzle_date")
        .in("id", puzzleIds)
    : { data: [] };

  const puzzleMap = Object.fromEntries(
    (puzzles ?? []).map((p) => [p.id, p.puzzle_date])
  );

  const recentGames = completedGuesses.map((g) => ({
    date: puzzleMap[g.puzzle_id] ?? (g.submitted_at ? g.submitted_at.split("T")[0] : null),
    guessesUsed: g.guesses_used,
    isSolved: g.is_solved,
    timeInSeconds: g.time_taken_seconds ?? 0,
    percentDiff: g.percent_diff ?? 0,
  }));

  const solvedDist =
    (stats?.solved_distribution as Record<string, number>) ?? {};
  const totalGames = stats?.total_games ?? 0;
  const failedGames = stats?.failed_games ?? 0;

  return NextResponse.json({
    success: true,
    data: {
      totalGames,
      solvedDistribution: solvedDist,
      failedGames,
      currentStreak: stats?.current_streak ?? 0,
      maxStreak: stats?.max_streak ?? 0,
      averageGuesses: getAverageGuessesFromSolvedDistribution(solvedDist),
      averageGuessesIncludingLosses: getAverageGuessesIncludingLosses(
        solvedDist,
        failedGames,
        totalGames,
        MAX_GUESSES
      ),
      winPercent: totalGames > 0 ? ((totalGames - failedGames) / totalGames) * 100 : 0,
      averagePercentDiff: parseFloat(stats?.average_percent_diff ?? "0") || 0,
      lastPlayedDate: stats?.last_played_date ?? null,
      recentGames,
    },
  });
}
