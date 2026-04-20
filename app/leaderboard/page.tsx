"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MAX_GUESSES } from "@/lib/game-config";

/** Matches Today tab: show 🔥 when streak is at least this many days */
const STREAK_FLAME_MIN = 3;

const LB_INK = "text-[#1a1a1b] dark:text-gray-100";
/** Shared cell: left-aligned; slight min-height so 2-line cells don’t make rows look uneven. */
const LB_CELL =
  "flex min-h-[3.25rem] sm:min-h-[3.5rem] lg:min-h-[3.75rem] min-w-0 items-center justify-start px-0.5 text-left text-base sm:text-xl lg:text-2xl font-normal";

/** Full-row background for top 3 (gold/silver/bronze) + highlight ring. */
function leaderboardPodiumCardClass(rank: number, highlight: boolean): string {
  const base = "p-2 sm:p-3 rounded-lg border";
  /** Visible gold / silver / bronze tints on dark backgrounds (not near-black). */
  const darkGold =
    "dark:bg-amber-600/25 dark:border-amber-400/90 dark:shadow-[inset_0_0_0_1px_rgba(251,191,36,0.35)]";
  const darkSilver =
    "dark:bg-slate-500/30 dark:border-slate-300/75 dark:shadow-[inset_0_0_0_1px_rgba(203,213,225,0.25)]";
  const darkBronze =
    "dark:bg-orange-700/30 dark:border-orange-400/85 dark:shadow-[inset_0_0_0_1px_rgba(251,146,60,0.35)]";
  if (highlight && rank === 1) {
    return `${base} border-2 border-[#6aaa64] bg-amber-100/90 ${darkGold}`;
  }
  if (highlight && rank === 2) {
    return `${base} border-2 border-[#6aaa64] bg-slate-200/95 ${darkSilver}`;
  }
  if (highlight && rank === 3) {
    return `${base} border-2 border-[#6aaa64] bg-orange-100/95 ${darkBronze}`;
  }
  if (highlight) {
    return `${base} border-2 border-[#6aaa64] bg-[#6aaa64]/15 dark:bg-[#6aaa64]/25`;
  }
  if (rank === 1) {
    return `${base} border-amber-300/90 bg-amber-100/90 ${darkGold}`;
  }
  if (rank === 2) {
    return `${base} border-slate-300 bg-slate-200/95 ${darkSilver}`;
  }
  if (rank === 3) {
    return `${base} border-orange-300/90 bg-orange-100/95 ${darkBronze}`;
  }
  return `${base} border-[#d3d6da] dark:border-gray-600 bg-[#f6f7f8] dark:bg-gray-700`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface DailyEntry {
  rank: number;
  userId: string;
  username: string;
  isSolved: boolean;
  guessesUsed: number;
  timeInSeconds: number;
  percentDiff: number;
  /** Gut feeling (first guess): sum |guess−actual| on first attempt */
  firstGuessDiff: number;
  submittedAt?: string;
  currentStreak?: number;
}

type AllTimeTab =
  | "alltime-wins"
  | "alltime-bestgutfeeling"
  | "alltime-maxstreak";

type LeaderboardTab = "daily" | AllTimeTab;

interface AllTimeEntry {
  rank: number;
  userId: string;
  username: string;
  wins: number;
  totalGames: number;
  winPercent: number;
  averageGuesses: number;
  averagePercentDiff: number;
  totalScore: number;
  maxStreak?: number;
  currentStreak?: number;
  /** Result on the current puzzle date (aligned with the Today tab) */
  todayStatus?: "win" | "loss" | "didNotPlay";
  /** Lowest first-guess diff on any single puzzle (all-time-best tab) */
  bestFirstGuessDiff?: number;
}

type LeaderboardEntry = DailyEntry | AllTimeEntry;

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [type, setType] = useState<LeaderboardTab>("daily");
  const [userRank, setUserRank] = useState<number | undefined>();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setEntries([]);
    setUserRank(undefined);

    const apiType = type === "daily" ? "daily" : type;
    const limitParam =
      apiType === "alltime-maxstreak" ||
      apiType === "alltime-wins" ||
      apiType === "alltime-bestgutfeeling"
        ? "&limit=25"
        : "";
    fetch(`/api/leaderboard?type=${apiType}${limitParam}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setEntries(json.data.entries ?? []);
          setUserRank(json.data.userRank);
          setIsDemoMode(json.data.isDemoMode ?? false);
        }
      })
      .catch(() => {
        setEntries([]);
        setUserRank(undefined);
      })
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="flex justify-center w-full">
      <main className="min-h-screen flex flex-col p-2 sm:p-4 w-full max-w-[96vw]">
      <header className="flex flex-col gap-0.5 mb-3 sm:mb-6">
        <div className="flex justify-between items-center min-h-9 sm:min-h-11">
          <Link href="/" className="text-base sm:text-lg lg:text-2xl font-bold text-[#1a1a1b] dark:text-gray-100 py-1 -my-1 sm:py-2 sm:-my-2 min-h-[36px] sm:min-h-[44px] flex items-center">
            🃏 Hold&apos;emle 🃏
          </Link>
          <Link href="/" className="text-xs sm:text-base lg:text-xl text-gray-600 dark:text-gray-400 hover:text-[#1a1a1b] dark:hover:text-gray-100 py-1 sm:py-2 min-h-[36px] sm:min-h-[44px] flex items-center mr-14">
            ← Back
          </Link>
        </div>
      </header>

      <h1 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-2 sm:mb-3 text-[#1a1a1b] dark:text-gray-100">Leaderboard</h1>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
        <button
          type="button"
          onClick={() => setType("daily")}
          className={`min-h-[44px] sm:min-h-[50px] px-4 sm:px-5 py-2 sm:py-2.5 text-base sm:text-lg lg:text-xl rounded-xl font-medium [touch-action:manipulation] ${
            type === "daily"
              ? "bg-[#6aaa64] text-white"
              : "bg-[#f6f7f8] dark:bg-gray-700 border border-[#d3d6da] dark:border-gray-600 text-[#1a1a1b] dark:text-gray-200"
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => setType("alltime-wins")}
          className={`min-h-[44px] sm:min-h-[50px] px-4 sm:px-5 py-2 sm:py-2.5 text-base sm:text-lg lg:text-xl rounded-xl font-medium [touch-action:manipulation] ${
            type === "alltime-wins"
              ? "bg-[#6aaa64] text-white"
              : "bg-[#f6f7f8] dark:bg-gray-700 border border-[#d3d6da] dark:border-gray-600 text-[#1a1a1b] dark:text-gray-200"
          }`}
        >
          Wins (All time)
        </button>
        <button
          type="button"
          onClick={() => setType("alltime-bestgutfeeling")}
          className={`min-h-[44px] sm:min-h-[50px] px-4 sm:px-5 py-2 sm:py-2.5 text-base sm:text-lg lg:text-xl rounded-xl font-medium [touch-action:manipulation] ${
            type === "alltime-bestgutfeeling"
              ? "bg-[#6aaa64] text-white"
              : "bg-[#f6f7f8] dark:bg-gray-700 border border-[#d3d6da] dark:border-gray-600 text-[#1a1a1b] dark:text-gray-200"
          }`}
        >
          Best Gut Feeling (All time)
        </button>
        <button
          type="button"
          onClick={() => setType("alltime-maxstreak")}
          className={`min-h-[44px] sm:min-h-[50px] px-4 sm:px-5 py-2 sm:py-2.5 text-base sm:text-lg lg:text-xl rounded-xl font-medium [touch-action:manipulation] ${
            type === "alltime-maxstreak"
              ? "bg-[#6aaa64] text-white"
              : "bg-[#f6f7f8] dark:bg-gray-700 border border-[#d3d6da] dark:border-gray-600 text-[#1a1a1b] dark:text-gray-200"
          }`}
        >
          Max Streak (All time)
        </button>
      </div>

      {type === "daily" ? (
        <p className="text-red-600 dark:text-white font-medium text-sm sm:text-base lg:text-lg mb-3 sm:mb-4 text-center w-full">
          Gut Feeling = First Guess
        </p>
      ) : null}

      {loading ? (
        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-base lg:text-xl">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-base lg:text-xl">
          {isDemoMode
            ? "Login and play to see the leaderboard."
            : type === "daily"
              ? "No entries yet. Be the first to complete today's puzzle!"
              : "No entries yet. Play some games to appear on the leaderboard."}
        </p>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {entries.map((e) => {
            const highlight =
              userRank !== undefined && e.rank === userRank;
            const podiumCardClass = leaderboardPodiumCardClass(e.rank, highlight);

            if (type === "daily") {
              const d = e as DailyEntry;
              const resultColor = d.isSolved
                ? "text-[#6aaa64]"
                : "text-[#dc2626]";
              const streak = d.currentStreak ?? 0;
              return (
                <div key={e.userId + e.rank} className={podiumCardClass}>
                  <div
                    className={`grid min-w-0 grid-cols-[minmax(0,2.5fr)_minmax(0,0.85fr)_minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1.5fr)_minmax(0,1.5fr)] gap-x-1 sm:gap-x-2 ${LB_INK}`}
                  >
                    <div
                      className={`${LB_CELL} gap-1.5 sm:gap-2`}
                      title={d.username}
                    >
                      <span className="shrink-0 tabular-nums">#{e.rank}</span>
                      <span className="min-w-0 truncate font-bold">
                        {d.username}
                      </span>
                    </div>
                    <div className={LB_CELL}>
                      <span
                        className={`min-w-0 leading-tight font-bold ${resultColor}`}
                      >
                        {d.isSolved ? "WON" : "LOSS"}
                      </span>
                    </div>
                    <div className={LB_CELL}>
                      <span className="min-w-0 leading-tight">
                        Guesses:{" "}
                        <span className="font-bold">{d.guessesUsed}</span> /{" "}
                        {MAX_GUESSES}
                      </span>
                    </div>
                    <div
                      className={`${LB_CELL} flex-col !items-start justify-center gap-0.5`}
                    >
                      <span className="min-w-0 leading-tight">
                        Time: {formatTime(d.timeInSeconds)}
                      </span>
                      {d.percentDiff > 0 ? (
                        <span className="min-w-0 leading-tight">
                          Diff: Δ{d.percentDiff.toFixed(0)}%
                        </span>
                      ) : null}
                    </div>
                    <div className={LB_CELL}>
                      {streak >= STREAK_FLAME_MIN ? (
                        <span className="min-w-0 text-left text-base sm:text-xl lg:text-2xl leading-tight text-[#f5793a]">
                          🔥 {streak} days straight!
                        </span>
                      ) : null}
                    </div>
                    <div className={`${LB_CELL} flex-col !items-start justify-center gap-0.5`}>
                      <span className="min-w-0 leading-tight">
                        Gut Feeling Diff:{" "}
                        <span className="font-bold">
                          Δ{(d.firstGuessDiff ?? 0).toFixed(0)}%
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            if (type === "alltime-wins") {
              const w = e as AllTimeEntry;
              const pct = w.winPercent ?? 0;
              return (
                <div key={e.userId + e.rank} className={podiumCardClass}>
                  <div className={`grid min-w-0 grid-cols-4 gap-x-1 sm:gap-x-2 ${LB_INK}`}>
                    <div
                      className={`${LB_CELL} gap-1.5 sm:gap-2`}
                      title={w.username}
                    >
                      <span className="shrink-0 tabular-nums">#{e.rank}</span>
                      <span className="min-w-0 truncate font-bold">
                        {w.username}
                      </span>
                    </div>
                    <div className={LB_CELL}>
                      <span className="min-w-0 leading-tight">
                        Wins: <span className="font-bold">{w.wins}</span> /{" "}
                        {w.totalGames}
                      </span>
                    </div>
                    <div className={LB_CELL}>
                      <span className="min-w-0 leading-tight">
                        Win %: <span className="font-bold">{pct.toFixed(0)}</span>%
                      </span>
                    </div>
                    <div className={LB_CELL}>
                      <span className="min-w-0 leading-tight">
                        Avg guesses:{" "}
                        <span className="font-bold">
                          {(w.averageGuesses ?? 0).toFixed(1)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            if (type === "alltime-bestgutfeeling") {
              const w = e as AllTimeEntry;
              const pct = w.winPercent ?? 0;
              const bg = w.bestFirstGuessDiff ?? 0;
              return (
                <div key={e.userId + e.rank} className={podiumCardClass}>
                  <div
                    className={`grid min-w-0 grid-cols-[minmax(0,2.5fr)_minmax(0,3fr)_minmax(0,1.5fr)_minmax(0,1.5fr)] gap-x-1 sm:gap-x-2 ${LB_INK}`}
                  >
                    <div
                      className={`${LB_CELL} gap-1.5 sm:gap-2`}
                      title={w.username}
                    >
                      <span className="shrink-0 tabular-nums">#{e.rank}</span>
                      <span className="min-w-0 truncate font-bold">
                        {w.username}
                      </span>
                    </div>
                    <div className={LB_CELL}>
                      <span className="min-w-0 leading-tight">
                        Best Gut Feeling:{" "}
                        <span className="font-bold">Δ{bg.toFixed(1)}%</span>
                      </span>
                    </div>
                    <div className={LB_CELL}>
                      <span className="min-w-0 leading-tight">
                        Win %: <span className="font-bold">{pct.toFixed(0)}</span>%
                      </span>
                    </div>
                    <div className={LB_CELL}>
                      <span className="min-w-0 leading-tight">
                        Wins: <span className="font-bold">{w.wins}</span> /{" "}
                        {w.totalGames}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            if (type === "alltime-maxstreak") {
              const a = e as AllTimeEntry;
              const cur = a.currentStreak ?? 0;
              const ts = a.todayStatus;
              const todayColor =
                ts === "win"
                  ? "text-[#6aaa64]"
                  : ts === "loss"
                    ? "text-[#dc2626]"
                    : "text-gray-500 dark:text-gray-400";
              return (
                <div key={e.userId + e.rank} className={podiumCardClass}>
                  <div className={`grid min-w-0 grid-cols-4 gap-x-1 sm:gap-x-2 ${LB_INK}`}>
                    <div className={`${LB_CELL} gap-1.5 sm:gap-2`} title={a.username}>
                      <span className="shrink-0 tabular-nums">#{e.rank}</span>
                      <span className="min-w-0 truncate font-bold">{a.username}</span>
                    </div>
                    <div className={LB_CELL}>
                      <span className="min-w-0 leading-tight">
                        Best: <span className="font-bold">{a.maxStreak ?? 0}</span>{" "}
                        days
                      </span>
                    </div>
                    <div className={LB_CELL}>
                      <span className="min-w-0 leading-tight">
                        Current: {cur} day{cur !== 1 ? "s" : ""}
                        {cur >= STREAK_FLAME_MIN ? (
                          <span className="text-[#f5793a]" aria-hidden>
                            {" "}
                            🔥
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className={`${LB_CELL} ${todayColor}`}>
                      <span className="min-w-0 leading-tight">
                        Today:{" "}
                        {ts === "win"
                          ? "WIN"
                          : ts === "loss"
                            ? "LOSS"
                            : "DID NOT PLAY"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}

      {userRank && (
        <p className="mt-4 sm:mt-6 text-center text-[#6aaa64] dark:text-[#7dbb77] font-bold text-lg sm:text-2xl lg:text-3xl">
          Your rank: #{userRank}
        </p>
      )}
    </main>
    </div>
  );
}
