import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUseDemo } from "@/lib/demo-mode";
import { getAverageGuessesFromSolvedDistribution } from "@/lib/utils/solved-distribution";

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
        totalScore: 0,
        averageGuesses: 0,
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
    .select("puzzle_id, total_score, guesses_used, is_solved, submitted_at")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(10);

  const puzzleIds = [...new Set((recentGuesses ?? []).map((g) => g.puzzle_id))];
  const { data: puzzles } = puzzleIds.length
    ? await supabase
        .from("puzzles")
        .select("id, puzzle_date")
        .in("id", puzzleIds)
    : { data: [] };

  const puzzleMap = Object.fromEntries(
    (puzzles ?? []).map((p) => [p.id, p.puzzle_date])
  );

  const recentGames = (recentGuesses ?? []).map((g) => ({
    date: puzzleMap[g.puzzle_id],
    score: g.total_score,
    guessesUsed: g.guesses_used,
    isSolved: g.is_solved,
  }));

  const solvedDist =
    (stats?.solved_distribution as Record<string, number>) ?? {};

  return NextResponse.json({
    success: true,
    data: {
      totalGames: stats?.total_games ?? 0,
      solvedDistribution: solvedDist,
      failedGames: stats?.failed_games ?? 0,
      currentStreak: stats?.current_streak ?? 0,
      maxStreak: stats?.max_streak ?? 0,
      totalScore: stats?.total_score ?? 0,
      averageGuesses: getAverageGuessesFromSolvedDistribution(solvedDist),
      averagePercentDiff: parseFloat(stats?.average_percent_diff ?? "0") || 0,
      lastPlayedDate: stats?.last_played_date ?? null,
      recentGames,
    },
  });
}
