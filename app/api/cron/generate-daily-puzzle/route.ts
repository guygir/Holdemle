/**
 * Cron endpoint to generate daily puzzle.
 * Secured by CRON_SECRET. Call with: Authorization: Bearer ${CRON_SECRET}
 *
 * Query: ?date=YYYY-MM-DD (optional, defaults to today)
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePreFlopOdds, roundToSum100 } from "@/lib/poker/odds-calculator";
import {
  generateFourHandsWithFamilies,
  DEFAULT_HAND_FAMILY_WEIGHTS,
  type HandFamily,
} from "@/lib/poker/hand-families";

function parseWeights(): Record<HandFamily, number> {
  const raw = process.env.HAND_FAMILY_WEIGHTS;
  if (!raw) return DEFAULT_HAND_FAMILY_WEIGHTS;
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return { ...DEFAULT_HAND_FAMILY_WEIGHTS, ...parsed };
  } catch {
    return DEFAULT_HAND_FAMILY_WEIGHTS;
  }
}

function calculateDifficulty(odds: number[]): "easy" | "medium" | "hard" {
  const max = Math.max(...odds);
  const min = Math.min(...odds);
  const spread = max - min;
  if (spread >= 15) return "easy";
  if (spread >= 8) return "medium";
  return "hard";
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      { error: "Missing Supabase credentials" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  let targetDate: Date;
  if (dateParam) {
    targetDate = new Date(dateParam);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format (use YYYY-MM-DD)" },
        { status: 400 }
      );
    }
  } else {
    targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1); // tomorrow
  }
  const dateStr = targetDate.toISOString().split("T")[0];

  try {
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("puzzles")
      .select("id")
      .eq("puzzle_date", dateStr)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Puzzle already exists",
        date: dateStr,
      });
    }

    const weights = parseWeights();
    let hands: [string, string][] | null = null;
    let odds: number[] = [];
    for (let attempt = 0; attempt < 50; attempt++) {
      hands = generateFourHandsWithFamilies(weights);
      if (!hands) continue;
      odds = await calculatePreFlopOdds(hands);
      if (odds.every((o) => o >= 5 && o <= 50)) break;
    }

    if (!hands || odds.some((o) => o < 5 || o > 50)) {
      return NextResponse.json(
        { error: "Could not generate valid puzzle", date: dateStr },
        { status: 500 }
      );
    }

    const rounded = roundToSum100(odds);
    const difficulty = calculateDifficulty(rounded);
    const puzzleHands = hands.map((cards, idx) => ({
      position: idx + 1,
      cards,
      actualPercent: rounded[idx],
    }));

    const { data: puzzle, error } = await supabase
      .from("puzzles")
      .insert({
        puzzle_date: dateStr,
        hands: puzzleHands,
        difficulty,
      })
      .select()
      .single();

    if (error) {
      console.error("Cron puzzle insert error:", error);
      return NextResponse.json(
        { error: "Failed to insert puzzle", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Generated puzzle for ${dateStr}`,
      date: dateStr,
      difficulty,
      puzzle,
    });
  } catch (err) {
    console.error("Cron generate-daily-puzzle error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err instanceof Error ? err.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
