import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getUseDemo } from "@/lib/demo-mode";

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

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
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

  const { data: puzzle, error } = await supabase
    .from("puzzles")
    .select("*")
    .eq("puzzle_date", today)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching puzzle:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch puzzle" },
      { status: 500 }
    );
  }

  if (!puzzle) {
    return NextResponse.json({
      success: false,
      error: "No puzzle for today",
      data: null,
    });
  }

  const user = (await supabase.auth.getUser()).data.user;
  let userGuess = null;

  if (user) {
    const { data: guess } = await supabase
      .from("guesses")
      .select("*")
      .eq("puzzle_id", puzzle.id)
      .eq("user_id", user.id)
      .single();
    userGuess = guess;
  }

  return NextResponse.json({
    success: true,
    data: {
      puzzleId: puzzle.id,
      date: puzzle.puzzle_date,
      hands: puzzle.hands.map((h: { position: number; cards: string[]; actualPercent?: number }) => ({
        position: h.position,
        cards: h.cards,
        // Don't send actualPercent to client - only in results
      })),
      difficulty: puzzle.difficulty,
      userHasGuessed: !!userGuess,
      userGuess: userGuess
        ? {
            guessHistory: userGuess.guess_history,
            guessesUsed: userGuess.guesses_used,
            isSolved: userGuess.is_solved,
            score: userGuess.total_score,
            actualPercentages: puzzle.hands.map(
              (h: { position: number; actualPercent: number }) => ({
                position: h.position,
                percent: h.actualPercent,
              })
            ),
          }
        : undefined,
    },
  });
}
