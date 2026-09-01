import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUseDemo } from "@/lib/demo-mode";
import {
  fetchHonorableMentions,
  type HonorableMentionsPayload,
} from "@/lib/honorable-mentions";
import {
  calculatePreFlopOdds,
  calculatePostFlopOddsExhaustive,
  roundToSum100,
} from "@/lib/poker/odds-calculator";

export const dynamic = "force-dynamic";

const PRODUCTION_APP = "https://holdemle.vercel.app";

let productionFallbackCache: {
  key: string;
  payload: HonorableMentionsPayload;
} | null = null;

async function fetchProductionFirstGuessMentions(): Promise<HonorableMentionsPayload> {
  const empty: HonorableMentionsPayload = {
    mentions: [],
    lastMonthUserCount: 0,
    lastMonthSolveCount: 0,
  };
  try {
    const [lbRes, dailyRes] = await Promise.all([
      fetch(`${PRODUCTION_APP}/api/leaderboard?type=daily&limit=100`, {
        cache: "no-store",
      }),
      fetch(`${PRODUCTION_APP}/api/puzzle/daily`, { cache: "no-store" }),
    ]);
    if (!lbRes.ok || !dailyRes.ok) return empty;
    const lb = await lbRes.json();
    const daily = await dailyRes.json();
    const entries = (lb.data?.entries ?? []) as Array<{
      username: string;
      isSolved: boolean;
      guessesUsed: number;
      submittedAt?: string;
    }>;
    const firstTry = entries.filter((e) => e.isSolved && e.guessesUsed === 1);
    const puzzle = daily.data as {
      date?: string;
      hands?: Array<{ position: number; cards: [string, string] }>;
      flop?: [string, string, string];
    } | null;
    if (!firstTry.length || !puzzle?.date || !puzzle.hands?.length) return empty;

    const cacheKey = `${puzzle.date}:${firstTry.map((e) => e.username).join(",")}`;
    if (productionFallbackCache?.key === cacheKey) {
      return productionFallbackCache.payload;
    }

    const holeCards = puzzle.hands.map((h) => h.cards);
    const raw = puzzle.flop
      ? calculatePostFlopOddsExhaustive(holeCards, puzzle.flop)
      : await calculatePreFlopOdds(holeCards, 12_000);
    const percents = roundToSum100(raw);
    const hands = puzzle.hands.map((h, i) => ({
      position: h.position,
      cards: h.cards,
      percent: percents[i] ?? 0,
    }));

    const payload: HonorableMentionsPayload = {
      mentions: firstTry.slice(0, 3).map((e) => ({
        nickname: e.username,
        date: puzzle.date as string,
        submittedAt: e.submittedAt ?? `${puzzle.date}T00:00:00.000Z`,
        flop: puzzle.flop ?? null,
        hands,
      })),
      lastMonthUserCount: 0,
      lastMonthSolveCount: 0,
    };
    productionFallbackCache = { key: cacheKey, payload };
    return payload;
  } catch (err) {
    console.error("Honorable mentions production fallback error:", err);
    return empty;
  }
}

export async function GET() {
  const useDemo = getUseDemo();
  if (useDemo === "fail") {
    return NextResponse.json(
      { success: false, error: "Supabase not configured" },
      { status: 503 }
    );
  }
  if (useDemo) {
    const data = await fetchProductionFirstGuessMentions();
    return NextResponse.json({
      success: true,
      data: { ...data, isDemoMode: true },
    });
  }

  try {
    const admin = createAdminClient();
    const data = await fetchHonorableMentions(admin);
    return NextResponse.json(
      { success: true, data: { ...data, isDemoMode: false } },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  } catch (err) {
    console.error("Honorable mentions error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch honorable mentions" },
      { status: 500 }
    );
  }
}
