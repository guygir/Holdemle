import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUseDemo } from "@/lib/demo-mode";
import { MAX_GUESSES } from "@/lib/game-config";
import { getCurrentPuzzleDate } from "@/lib/puzzle";

// Demo puzzles - Percentages calculated with exhaustive enumeration
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

const DEMO3_PUZZLE = {
  id: "demo3-puzzle",
  puzzle_date: new Date().toISOString().split("T")[0],
  hands: [
    { position: 1, cards: ["As", "Ah"], actualPercent: 70 },
    { position: 2, cards: ["Kd", "Kc"], actualPercent: 18 },
    { position: 3, cards: ["Qh", "Js"], actualPercent: 12 },
  ],
  difficulty: "easy",
};

const DEMO5_PUZZLE = {
  id: "demo5-puzzle",
  puzzle_date: new Date().toISOString().split("T")[0],
  hands: [
    { position: 1, cards: ["As", "Kh"], actualPercent: 25 },
    { position: 2, cards: ["Qd", "Qc"], actualPercent: 31 },
    { position: 3, cards: ["Jh", "Js"], actualPercent: 16 },
    { position: 4, cards: ["Tc", "9c"], actualPercent: 14 },
    { position: 5, cards: ["7d", "7h"], actualPercent: 14 },
  ],
  difficulty: "hard",
};

// 4 hands + flop (post-flop equity) - 99 has set on Th 9h 2d
const DEMO_FLOP_PUZZLE = {
  id: "demo-flop-puzzle",
  puzzle_date: new Date().toISOString().split("T")[0],
  flop: ["Th", "9h", "2d"] as [string, string, string],
  hands: [
    { position: 1, cards: ["As", "Kh"], actualPercent: 4 },
    { position: 2, cards: ["Qd", "Qc"], actualPercent: 8 },
    { position: 3, cards: ["Jh", "Js"], actualPercent: 11 },
    { position: 4, cards: ["9c", "9d"], actualPercent: 77 },
  ],
  difficulty: "medium",
};

export async function GET(request: Request) {
  const demoParam = new URL(request.url).searchParams.get("demo");
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
  
  // Select demo puzzle based on parameter
  let demoPuzzle = DEMO_PUZZLE as
    | typeof DEMO_PUZZLE
    | typeof DEMO3_PUZZLE
    | typeof DEMO5_PUZZLE
    | typeof DEMO_FLOP_PUZZLE;
  if (demoParam === "3") {
    demoPuzzle = DEMO3_PUZZLE;
  } else if (demoParam === "5") {
    demoPuzzle = DEMO5_PUZZLE;
  } else if (demoParam === "flop") {
    demoPuzzle = DEMO_FLOP_PUZZLE;
  }

  if (useDemo || demoParam) {
    const response: {
      puzzleId: string;
      date: string;
      hands: Array<{ position: number; cards: string[] }>;
      difficulty: string;
      flop?: [string, string, string];
      userHasGuessed: boolean;
      userGuess: undefined;
    } = {
      puzzleId: demoPuzzle.id,
      date: demoPuzzle.puzzle_date,
      hands: demoPuzzle.hands.map((h) => ({
        position: h.position,
        cards: h.cards,
      })),
      difficulty: demoPuzzle.difficulty,
      userHasGuessed: false,
      userGuess: undefined,
    };
    if ("flop" in demoPuzzle && demoPuzzle.flop) {
      response.flop = demoPuzzle.flop;
    }
    return NextResponse.json({ success: true, data: response });
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

  let sessionElapsedSeconds: number | null = null;
  if (user && userGuess && !gameOver) {
    const { data: session } = await supabase
      .from("puzzle_play_sessions")
      .select("started_at, paused_at, total_pause_seconds")
      .eq("user_id", user.id)
      .eq("puzzle_id", puzzle.id)
      .single();

    if (session) {
      const startedAt = new Date(session.started_at).getTime();
      const totalPause = session.total_pause_seconds ?? 0;
      if (session.paused_at) {
        const pausedAt = new Date(session.paused_at).getTime();
        sessionElapsedSeconds = Math.max(
          0,
          Math.floor((pausedAt - startedAt) / 1000) - totalPause
        );
      } else {
        sessionElapsedSeconds = Math.max(
          0,
          Math.floor((Date.now() - startedAt) / 1000) - totalPause
        );
      }
    }
  }

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
            pausedElapsedSeconds: sessionElapsedSeconds ?? userGuess.paused_elapsed_seconds ?? null,
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
