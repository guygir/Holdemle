import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUseDemo } from "@/lib/demo-mode";
import { sortDailyLeaderboard } from "@/lib/utils/leaderboard-sort";
import {
  countWins,
  getAverageGuessesIncludingLosses,
} from "@/lib/utils/solved-distribution";
import { calendarDayBefore } from "@/lib/streak";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "daily";
  const requestedLimit = Math.min(
    100,
    parseInt(searchParams.get("limit") || "50", 10)
  );
  const limit =
    type === "alltime-maxstreak" || type === "alltime-wins"
      ? Math.min(25, requestedLimit)
      : requestedLimit;

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
        type,
        entries: [],
        userRank: undefined,
        isDemoMode: true,
      },
    });
  }

  let adminSupabase;
  try {
    adminSupabase = createAdminClient();
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        type: type as "daily" | "alltime",
        entries: [],
        userRank: undefined,
        isDemoMode: true,
      },
    });
  }

  const supabase = await createServerSupabaseClient();
  const user = (await supabase.auth.getUser()).data.user;

  const allTimeTypes = [
    "alltime",
    "alltime-wins",
    "alltime-winpct",
    "alltime-avgguesses",
    "alltime-avgdiff",
    "alltime-maxstreak",
  ];
  if (allTimeTypes.includes(type)) {
    const { MAX_GUESSES: maxGuesses } = await import("@/lib/game-config");

    const { data: stats, error: statsError } = await adminSupabase
      .from("user_stats")
      .select(
        "user_id, total_games, solved_distribution, failed_games, average_percent_diff, total_score, max_streak, current_streak, last_played_date"
      );

    if (statsError) {
      console.error("Leaderboard user_stats fetch error:", statsError);
      return NextResponse.json({
        success: true,
        data: { type: type as "alltime" | "alltime-wins" | "alltime-winpct" | "alltime-avgguesses" | "alltime-avgdiff" | "alltime-maxstreak", entries: [], userRank: undefined, isDemoMode: false },
      });
    }

    const getWins = (s: { solved_distribution?: Record<string, number> }) =>
      countWins(s.solved_distribution);
    const getAvgGuesses = (
      s: {
        solved_distribution?: Record<string, number>;
        failed_games?: number;
        total_games?: number;
      }
    ) =>
      getAverageGuessesIncludingLosses(
        s.solved_distribution,
        s.failed_games ?? 0,
        s.total_games ?? 0,
        maxGuesses
      );
    const getWinPct = (
      s: { total_games?: number; failed_games?: number }
    ) => {
      const total = s.total_games ?? 0;
      if (total === 0) return 0;
      return ((total - (s.failed_games ?? 0)) / total) * 100;
    };

    type StatRow = {
      user_id: string;
      total_games?: number;
      solved_distribution?: Record<string, number>;
      failed_games?: number;
      average_percent_diff?: number;
      total_score?: number;
      max_streak?: number;
      current_streak?: number;
      last_played_date?: string | null;
    };
    type SortFn = (a: StatRow, b: StatRow) => number;
    const sortWins: SortFn = (a, b) => {
      const winsA = getWins(a);
      const winsB = getWins(b);
      if (winsB !== winsA) return winsB - winsA;
      const avgA = getAvgGuesses(a) || 999;
      const avgB = getAvgGuesses(b) || 999;
      if (avgA !== avgB) return avgA - avgB;
      const diffA = a.average_percent_diff ?? 999;
      const diffB = b.average_percent_diff ?? 999;
      return diffA - diffB;
    };
    const sortWinPct: SortFn = (a, b) => {
      const pctA = getWinPct(a);
      const pctB = getWinPct(b);
      if (pctB !== pctA) return pctB - pctA;
      return sortWins(a, b);
    };
    const sortAvgGuesses: SortFn = (a, b) => {
      const avgA = getAvgGuesses(a) ?? 999;
      const avgB = getAvgGuesses(b) ?? 999;
      if (avgA !== avgB) return avgA - avgB;
      return sortWins(a, b);
    };
    const sortAvgDiff: SortFn = (a, b) => {
      const diffA = a.average_percent_diff ?? 999;
      const diffB = b.average_percent_diff ?? 999;
      if (diffA !== diffB) return diffA - diffB;
      return sortWins(a, b);
    };

    const sortMaxStreak: SortFn = (a, b) => {
      const msA = (a as StatRow).max_streak ?? 0;
      const msB = (b as StatRow).max_streak ?? 0;
      if (msB !== msA) return msB - msA;
      const csA = (a as StatRow).current_streak ?? 0;
      const csB = (b as StatRow).current_streak ?? 0;
      if (csB !== csA) return csB - csA;
      return sortWins(a, b);
    };

    const sortFn =
      type === "alltime-maxstreak"
        ? sortMaxStreak
        : type === "alltime-winpct"
          ? sortWinPct
          : type === "alltime-avgguesses"
            ? sortAvgGuesses
            : type === "alltime-avgdiff"
              ? sortAvgDiff
              : sortWins;

    const filtered = (stats ?? []).filter((s) => (s.total_games ?? 0) > 0);
    const sorted = [...filtered].sort(sortFn).slice(0, limit);
    const fullSorted = [...filtered].sort(sortFn);

    const userIds = sorted.map((s) => s.user_id);
    const { data: profiles } = userIds.length
      ? await adminSupabase.from("profiles").select("user_id, nickname, email").in("user_id", userIds)
      : { data: [] };
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    let puzzleDateToday: string | null = null;
    let yesterdayStr: string | null = null;
    const todayStatusByUser = new Map<
      string,
      "win" | "loss" | "didNotPlay"
    >();

    if (type === "alltime-maxstreak") {
      const { getCurrentPuzzleDate } = await import("@/lib/puzzle");
      puzzleDateToday = await getCurrentPuzzleDate(adminSupabase);
      yesterdayStr =
        puzzleDateToday != null ? calendarDayBefore(puzzleDateToday) : null;
    }

    if (type === "alltime-maxstreak" && userIds.length && puzzleDateToday) {
      const { data: puzzleRow } = await adminSupabase
        .from("puzzles")
        .select("id")
        .eq("puzzle_date", puzzleDateToday)
        .maybeSingle();
      if (puzzleRow?.id) {
        const { MAX_GUESSES } = await import("@/lib/game-config");
        const { data: todayGuesses } = await adminSupabase
          .from("guesses")
          .select("user_id, is_solved, guesses_used")
          .eq("puzzle_id", puzzleRow.id)
          .in("user_id", userIds);
        const byUser = new Map(
          (todayGuesses ?? []).map((g) => [g.user_id, g])
        );
        for (const uid of userIds) {
          const g = byUser.get(uid);
          if (!g) {
            todayStatusByUser.set(uid, "didNotPlay");
            continue;
          }
          const completed =
            g.guesses_used > 0 &&
            (g.is_solved || g.guesses_used >= MAX_GUESSES);
          if (!completed) {
            todayStatusByUser.set(uid, "didNotPlay");
          } else {
            todayStatusByUser.set(uid, g.is_solved ? "win" : "loss");
          }
        }
      } else {
        for (const uid of userIds) {
          todayStatusByUser.set(uid, "didNotPlay");
        }
      }
    } else if (type === "alltime-maxstreak" && userIds.length) {
      for (const uid of userIds) {
        todayStatusByUser.set(uid, "didNotPlay");
      }
    }

    const entries = sorted.map((s, i) => {
      const p = profileMap.get(s.user_id);
      const displayName = p ? p.nickname : `Player ${String(s.user_id).slice(0, 8)}`;
      const base = {
        rank: i + 1,
        userId: s.user_id,
        username: displayName,
        wins: getWins(s),
        totalGames: s.total_games,
        winPercent: getWinPct(s),
        averageGuesses: getAvgGuesses(s),
        averagePercentDiff: parseFloat(String(s.average_percent_diff ?? 0)),
        totalScore: s.total_score,
      };
      if (type === "alltime-maxstreak") {
        const row = s as StatRow;
        const lastPlayed = row.last_played_date ?? null;
        const streakAlive =
          puzzleDateToday != null &&
          yesterdayStr != null &&
          lastPlayed != null &&
          (lastPlayed === puzzleDateToday || lastPlayed === yesterdayStr);
        const displayCurrentStreak = streakAlive
          ? (row.current_streak ?? 0)
          : 0;
        return {
          ...base,
          maxStreak: row.max_streak ?? 0,
          currentStreak: displayCurrentStreak,
          todayStatus:
            todayStatusByUser.get(s.user_id) ?? "didNotPlay",
        };
      }
      return base;
    });

    const userRank = user
      ? (fullSorted.findIndex((s) => s.user_id === user.id) + 1) || undefined
      : undefined;

    return NextResponse.json({
      success: true,
      data: {
        type: type as "alltime" | "alltime-wins" | "alltime-winpct" | "alltime-avgguesses" | "alltime-avgdiff" | "alltime-maxstreak",
        entries,
        userRank,
        isDemoMode: false,
      },
    });
  }

  const { getCurrentPuzzleDate } = await import("@/lib/puzzle");
  const currentDate = await getCurrentPuzzleDate(adminSupabase);
  if (!currentDate) {
    return NextResponse.json({
      success: true,
      data: {
        type: "daily",
        entries: [],
        userRank: undefined,
        isDemoMode: false,
      },
    });
  }
  const { data: puzzle } = await adminSupabase
    .from("puzzles")
    .select("id")
    .eq("puzzle_date", currentDate)
    .single();

  if (!puzzle) {
    return NextResponse.json({
      success: true,
      data: {
        type: "daily",
        entries: [],
        userRank: undefined,
        isDemoMode: false,
      },
    });
  }

  const { MAX_GUESSES } = await import("@/lib/game-config");

  const { data: guesses } = await adminSupabase
    .from("guesses")
    .select("user_id, is_solved, guesses_used, time_taken_seconds, percent_diff, submitted_at")
    .eq("puzzle_id", puzzle.id);

  const completed = (guesses ?? []).filter(
    (g) => g.guesses_used > 0 && (g.is_solved || g.guesses_used >= MAX_GUESSES)
  );
  const sorted = sortDailyLeaderboard(completed);
  const limited = sorted.slice(0, limit);
  const userIds = limited.map((g) => g.user_id);
  const { data: profiles } = userIds.length
    ? await adminSupabase.from("profiles").select("user_id, nickname, email").in("user_id", userIds)
    : { data: [] };
  const { data: statsRows } = userIds.length
    ? await adminSupabase.from("user_stats").select("user_id, current_streak").in("user_id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const streakMap = new Map((statsRows ?? []).map((s) => [s.user_id, s.current_streak ?? 0]));

  const entries = limited.map((g, i) => {
    const p = profileMap.get(g.user_id);
    const displayName = p ? p.nickname : `Player ${String(g.user_id).slice(0, 8)}`;
    return {
      rank: i + 1,
      userId: g.user_id,
      username: displayName,
      isSolved: g.is_solved,
      guessesUsed: g.guesses_used,
      timeInSeconds: g.time_taken_seconds,
      percentDiff: g.percent_diff ?? 0,
      submittedAt: g.submitted_at,
      currentStreak: streakMap.get(g.user_id) ?? 0,
    };
  });

  const userRank = user
    ? (sorted.findIndex((g) => g.user_id === user.id) + 1) || undefined
    : undefined;

  return NextResponse.json({
    success: true,
    data: { type: "daily", entries, userRank, isDemoMode: false },
  });
}
