import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUseDemo } from "@/lib/demo-mode";
import { MAX_GUESSES } from "@/lib/game-config";
import { getCurrentPuzzleDate } from "@/lib/puzzle";

// Demo puzzle - EXACT percentages from poker-odds-calc exhaustive (node scripts/calc-demo-odds.mjs)
const DEMO_PUZZLE = {
  id: "demo-puzzle",
  puzzle_date: new Date().toISOString().split("T")[0],
  hands: [
    { position: 1, cards: ["As", "Kh"], actualPercent: 30 },
    { position: 2, cards: ["Qd", "Qc"], actualPercent: 38 },
    { position: 3, cards: ["Jh", "Js"], actualPercent: 17 },
    { position: 4, cards: ["9c", "9d"], actualPercent: 15 },
  ],
  difficulty: "medium",
};

export async function GET(request: Request) {
  const isDemoRequest = new URL(request.url).searchParams.get("demo") === "1";
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
  if (useDemo || isDemoRequest) {
    return NextResponse.json({
      success: true,
      data: {
        puzzleId: DEMO_PUZZLE.id,
        date: DEMO_PUZZLE.puzzle_date,
        hands: DEMO_PUZZLE.hands.map((h) => ({
          position: h.position,
          cards: h.cards,
        })),
        difficulty: DEMO_PUZZLE.difficulty,
        userHasGuessed: false,
        userGuess: undefined,
      },
    });
  }

  const supabase = await createServerSupabaseClient();

  const currentDate = await getCurrentPuzzleDate(supabase);
  if (!currentDate) {
    return NextResponse.json({
      success: false,
      error: "No puzzle available yet. Today's puzzle is coming up shortly!",
      data: null,
    });
  }

  const { data: puzzle, error } = await supabase
    .from("puzzles")
    .select("*")
    .eq("puzzle_date", currentDate)
    .single();

  if (error || !puzzle) {
    console.error("Error fetching puzzle:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch puzzle" },
      { status: 500 }
    );
  }

  const user = (await supabase.auth.getUser()).data.user;
  let userGuess = null;
  let nickname = "";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("user_id", user.id)
      .maybeSingle();
    nickname = profile?.nickname ?? user.user_metadata?.nickname ?? user.email?.split("@")[0] ?? "";
    let { data: guess } = await supabase
      .from("guesses")
      .select("*")
      .eq("puzzle_id", puzzle.id)
      .eq("user_id", user.id)
      .single();

    // No guess yet: create starter row so timer starts at first sight of puzzle
    if (!guess) {
      await supabase.from("guesses").upsert(
        {
          user_id: user.id,
          puzzle_id: puzzle.id,
          guess_history: [],
          guesses_used: 0,
          is_solved: false,
          time_taken_seconds: 0,
          total_score: 0,
          percent_diff: 0,
          game_started_at: new Date().toISOString(),
        },
        { onConflict: "user_id,puzzle_id", ignoreDuplicates: true }
      );
      const { data: created } = await supabase
        .from("guesses")
        .select("*")
        .eq("puzzle_id", puzzle.id)
        .eq("user_id", user.id)
        .single();
      guess = created;
    }

    userGuess = guess;
  }

  const hasSubmitted = userGuess && userGuess.guesses_used > 0;
  const gameOver = userGuess && (userGuess.is_solved || userGuess.guesses_used >= MAX_GUESSES);

  return NextResponse.json({
    success: true,
    data: {
      puzzleId: puzzle.id,
      date: puzzle.puzzle_date,
      nickname: nickname || undefined,
      hands: puzzle.hands.map((h: { position: number; cards: string[]; actualPercent?: number }) => ({
        position: h.position,
        cards: h.cards,
      })),
      difficulty: puzzle.difficulty,
      userHasGuessed: !!hasSubmitted,
      userGuess: userGuess
        ? {
            guessHistory: userGuess.guess_history ?? [],
            guessesUsed: userGuess.guesses_used,
            isSolved: userGuess.is_solved,
            score: userGuess.total_score,
            timeTakenSeconds: userGuess.time_taken_seconds ?? 0,
            percentDiff: userGuess.percent_diff ?? 0,
            submittedAt: userGuess.submitted_at,
            gameStartedAt: userGuess.game_started_at ?? null,
            pausedElapsedSeconds: userGuess.paused_elapsed_seconds ?? null,
            actualPercentages: gameOver
              ? puzzle.hands.map(
                  (h: { position: number; actualPercent: number }) => ({
                    position: h.position,
                    percent: h.actualPercent,
                  })
                )
              : [],
          }
        : undefined,
    },
  });
}
