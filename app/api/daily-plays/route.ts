import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUseDemo } from "@/lib/demo-mode";

/**
 * Returns daily play counts for the chart.
 *
 * Data source: same as Today's leaderboard – puzzles with puzzle_date <= today (UTC).
 * For each puzzle, we count guesses where guesses_used > 0 (anyone who made at least one guess).
 * That includes more players than the leaderboard (which only shows completed games).
 *
 * X axis: days since launch (day 0 = first puzzle_date, last = today).
 * Y axis: number of plays per day.
 */
export async function GET(request: NextRequest) {
  const useDemo = getUseDemo();
  const debug = request.nextUrl.searchParams.get("debug") === "1";
  if (useDemo === "fail") {
    return NextResponse.json(
      { success: false, error: "Supabase not configured" },
      { status: 503 }
    );
  }
  if (useDemo) {
    return NextResponse.json({
      success: true,
      data: { launchDate: null, points: [] },
    });
  }

  try {
    const supabase = createAdminClient();

    const today = new Date().toISOString().split("T")[0];

    const { data: puzzles } = await supabase
      .from("puzzles")
      .select("id, puzzle_date")
      .lte("puzzle_date", today)
      .order("puzzle_date", { ascending: true });

    if (!puzzles || puzzles.length === 0) {
      return NextResponse.json({
        success: true,
        data: { launchDate: null, points: [] },
      });
    }

    const launchDate = puzzles[0].puzzle_date;
    const puzzleIds = puzzles.map((p) => p.id);

    const { data: guesses } = await supabase
      .from("guesses")
      .select("puzzle_id")
      .in("puzzle_id", puzzleIds)
      .gt("guesses_used", 0);

    const playsByPuzzleId = new Map<string, number>();
    for (const g of guesses ?? []) {
      const prev = playsByPuzzleId.get(g.puzzle_id) ?? 0;
      playsByPuzzleId.set(g.puzzle_id, prev + 1);
    }

    const points = puzzles.map((p) => {
      const plays = playsByPuzzleId.get(p.id) ?? 0;
      const launch = new Date(launchDate);
      const d = new Date(p.puzzle_date);
      const day = Math.floor((d.getTime() - launch.getTime()) / (24 * 60 * 60 * 1000));
      return { day, date: p.puzzle_date, plays };
    });

    if (debug) {
      const { MAX_GUESSES } = await import("@/lib/game-config");
      const lastPuzzle = puzzles[puzzles.length - 1];
      const { data: todayRows } = await supabase
        .from("guesses")
        .select("user_id, guesses_used, is_solved")
        .eq("puzzle_id", lastPuzzle.id)
        .gt("guesses_used", 0);
      const completedCount = (todayRows ?? []).filter(
        (g) => g.is_solved || (g.guesses_used ?? 0) >= MAX_GUESSES
      ).length;
      const graphValue = playsByPuzzleId.get(lastPuzzle.id) ?? 0;
      return NextResponse.json(
        {
          success: true,
          debug: {
            todayUtc: today,
            lastPuzzleDate: lastPuzzle.puzzle_date,
            lastPuzzleId: lastPuzzle.id,
            graphValueToday: graphValue,
            completedCount,
            inProgressCount: graphValue - completedCount,
            totalRowsForToday: todayRows?.length ?? 0,
            lastFivePoints: points.slice(-5),
            rows: todayRows ?? [],
          },
        },
        {
          headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" },
        }
      );
    }

    return NextResponse.json(
      { success: true, data: { launchDate, points } },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err) {
    console.error("Daily plays error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch daily plays" },
      { status: 500 }
    );
  }
}
