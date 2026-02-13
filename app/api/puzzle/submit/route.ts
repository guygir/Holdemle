import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUseDemo } from "@/lib/demo-mode";
import { getCurrentPuzzleDate } from "@/lib/puzzle";
import { validateGuesses } from "@/lib/utils/validation";
import { calculateScore } from "@/lib/utils/scoring";
import { MAX_GUESSES } from "@/lib/game-config";
import { sortDailyLeaderboard } from "@/lib/utils/leaderboard-sort";
import {
  countWins,
  incrementSolved,
  getAverageGuessesFromSolvedDistribution,
} from "@/lib/utils/solved-distribution";

type FeedbackType = "exact" | "high" | "low";

/** Sum of |guessed - actual| over all 4 hands for the final attempt */
function computePercentDiff(
  feedback: Array<{ position: number; percent: number }>,
  actuals: Array<{ position: number; percent: number }>
): number {
  const actualMap = Object.fromEntries(
    actuals.map((a) => [a.position, a.percent])
  );
  return feedback.reduce(
    (sum, g) => sum + Math.abs(g.percent - (actualMap[g.position] ?? 0)),
    0
  );
}

function getFeedback(guessed: number, actual: number): FeedbackType {
  if (guessed === actual) return "exact";
  if (guessed > actual) return "high";
  return "low";
}

export async function POST(request: NextRequest) {
  let body: {
    puzzleId: string;
    guesses: Array<{ position: number; percent: number }>;
    attemptNumber: number;
    timeInSeconds: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { puzzleId, guesses, attemptNumber, timeInSeconds } = body;

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
  // Demo puzzle can be submitted without auth (Try Demo flow)
  if (puzzleId === "demo-puzzle") {
    const validation = validateGuesses(guesses);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }
    if (attemptNumber < 1 || attemptNumber > MAX_GUESSES) {
      return NextResponse.json(
        {
          success: false,
          error: `Attempt must be 1 to ${MAX_GUESSES}`,
        },
        { status: 400 }
      );
    }
    const demoHands = [
      { position: 1, actualPercent: 30 },
      { position: 2, actualPercent: 38 },
      { position: 3, actualPercent: 17 },
      { position: 4, actualPercent: 15 },
    ];
    const actualPercents = Object.fromEntries(
      demoHands.map((h) => [h.position, h.actualPercent])
    );
    const feedback = guesses.map((g) => ({
      position: g.position,
      percent: g.percent,
      feedback: getFeedback(g.percent, actualPercents[g.position] ?? 0),
    }));
    const isSolved = feedback.every((f) => f.feedback === "exact");
    const totalScore = isSolved
      ? calculateScore(attemptNumber, timeInSeconds)
      : attemptNumber >= MAX_GUESSES
        ? calculateScore(MAX_GUESSES, timeInSeconds)
        : 0;
    const percentDiff = computePercentDiff(
      feedback,
      demoHands.map((h) => ({ position: h.position, percent: h.actualPercent }))
    );
    return NextResponse.json({
      success: true,
      data: {
        feedback,
        isSolved,
        guessesRemaining: Math.max(0, MAX_GUESSES - attemptNumber),
        totalScore: isSolved || attemptNumber >= MAX_GUESSES ? totalScore : undefined,
        percentDiff,
        actualPercentages: demoHands.map((h) => ({
          position: h.position,
          percent: h.actualPercent,
        })),
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

  if (!puzzleId || !guesses || !attemptNumber || !Number.isFinite(timeInSeconds)) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  const validation = validateGuesses(guesses);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 }
    );
  }

  if (attemptNumber < 1 || attemptNumber > MAX_GUESSES) {
    return NextResponse.json(
      {
        success: false,
        error: `Attempt must be 1 to ${MAX_GUESSES}`,
      },
      { status: 400 }
    );
  }

  const { data: puzzle, error: puzzleError } = await supabase
    .from("puzzles")
    .select("*, hands")
    .eq("id", puzzleId)
    .single();

  if (puzzleError || !puzzle) {
    return NextResponse.json(
      { success: false, error: "Puzzle not found" },
      { status: 404 }
    );
  }

  const currentDate = await getCurrentPuzzleDate(supabase);
  if (!currentDate || puzzle.puzzle_date !== currentDate) {
    return NextResponse.json(
      { success: false, error: "Can only submit for the current puzzle" },
      { status: 400 }
    );
  }

  const hands = puzzle.hands as Array<{
    position: number;
    cards: string[];
    actualPercent: number;
  }>;
  const actualPercents = Object.fromEntries(
    hands.map((h) => [h.position, h.actualPercent])
  );

  const feedback = guesses.map((g) => ({
    position: g.position,
    percent: g.percent,
    feedback: getFeedback(g.percent, actualPercents[g.position] ?? 0),
  }));

  const isSolved = feedback.every((f) => f.feedback === "exact");

  const { data: existingGuess } = await supabase
    .from("guesses")
    .select("*")
    .eq("puzzle_id", puzzleId)
    .eq("user_id", user.id)
    .single();

  const previousHistory = (existingGuess?.guess_history as Array<unknown>) ?? [];
  const newAttempt = {
    attempt: attemptNumber,
    guesses: feedback,
  };
  const guessHistory = [...previousHistory, newAttempt];
  const guessesUsed = attemptNumber;
  const totalScore = isSolved
    ? calculateScore(guessesUsed, timeInSeconds)
    : guessesUsed >= MAX_GUESSES
      ? calculateScore(MAX_GUESSES, timeInSeconds)
      : 0;

  const percentDiff = computePercentDiff(
    feedback,
    hands.map((h) => ({ position: h.position, percent: h.actualPercent }))
  );

  if (existingGuess) {
    if (existingGuess.is_solved) {
      return NextResponse.json(
        { success: false, error: "Puzzle already solved" },
        { status: 400 }
      );
    }
    if (existingGuess.guesses_used >= MAX_GUESSES) {
      return NextResponse.json(
        { success: false, error: "No guesses remaining" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("guesses")
      .update({
        guess_history: guessHistory,
        guesses_used: guessesUsed,
        is_solved: isSolved,
        time_taken_seconds: timeInSeconds,
        total_score: totalScore,
        percent_diff: percentDiff,
      })
      .eq("id", existingGuess.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to save guess" },
        { status: 500 }
      );
    }
  } else {
    const gameStartedAt = new Date(Date.now() - timeInSeconds * 1000).toISOString();
    const { error: insertError } = await supabase.from("guesses").insert({
      user_id: user.id,
      puzzle_id: puzzleId,
      guess_history: guessHistory,
      guesses_used: guessesUsed,
      is_solved: isSolved,
      time_taken_seconds: timeInSeconds,
      total_score: totalScore,
      percent_diff: percentDiff,
      game_started_at: gameStartedAt,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to save guess" },
        { status: 500 }
      );
    }
  }

  if (isSolved || guessesUsed >= MAX_GUESSES) {
    await updateUserStats(supabase, user.id, {
      guessesUsed,
      isSolved,
      totalScore,
      puzzleDate: puzzle.puzzle_date,
      percentDiff,
    });
  }

  const guessesRemaining = Math.max(0, MAX_GUESSES - guessesUsed);

  let rank: number | undefined;
  if (isSolved || guessesUsed >= MAX_GUESSES) {
    const { data: leaderboard } = await supabase
      .from("guesses")
      .select("user_id, is_solved, guesses_used, time_taken_seconds, percent_diff")
      .eq("puzzle_id", puzzleId);
    const completed = (leaderboard ?? []).filter((g) => g.guesses_used > 0);
    const sorted = sortDailyLeaderboard(completed);
    const userIndex = sorted.findIndex((r) => r.user_id === user.id);
    rank = userIndex >= 0 ? userIndex + 1 : undefined;
  }

  return NextResponse.json({
    success: true,
    data: {
      feedback,
      isSolved,
      guessesRemaining,
      totalScore: isSolved || guessesUsed >= MAX_GUESSES ? totalScore : undefined,
      percentDiff,
      rank,
      actualPercentages: hands.map((h) => ({
        position: h.position,
        percent: h.actualPercent,
      })),
    },
  });
}

async function updateUserStats(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  params: {
    guessesUsed: number;
    isSolved: boolean;
    totalScore: number;
    puzzleDate: string;
    percentDiff: number;
  }
) {
  const { data: stats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  const lastDate = stats?.last_played_date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const currentStreak =
    lastDate === yesterdayStr
      ? (stats?.current_streak ?? 0) + 1
      : params.isSolved
        ? 1
        : 0;

  const currentDist = (stats?.solved_distribution as Record<string, number>) ?? {};
  const newSolvedDistribution = params.isSolved
    ? incrementSolved(currentDist, params.guessesUsed)
    : currentDist;

  const newStats = {
    total_games: (stats?.total_games ?? 0) + 1,
    solved_distribution: newSolvedDistribution,
    failed_games: !params.isSolved
      ? (stats?.failed_games ?? 0) + 1
      : stats?.failed_games ?? 0,
    current_streak: params.isSolved ? currentStreak : 0,
    max_streak: Math.max(
      stats?.max_streak ?? 0,
      params.isSolved ? currentStreak : 0
    ),
    total_score: (stats?.total_score ?? 0) + params.totalScore,
    average_guesses: getAverageGuessesFromSolvedDistribution(newSolvedDistribution),
    average_percent_diff: stats
      ? ((stats.average_percent_diff ?? 0) * (stats.total_games ?? 0) + params.percentDiff) /
        ((stats.total_games ?? 0) + 1)
      : params.percentDiff,
    last_played_date: params.puzzleDate,
    updated_at: new Date().toISOString(),
  };

  await supabase.from("user_stats").upsert(
    {
      user_id: userId,
      ...newStats,
    },
    { onConflict: "user_id" }
  );
}
