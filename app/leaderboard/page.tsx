"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MAX_GUESSES } from "@/lib/game-config";

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
  submittedAt?: string;
}

interface AllTimeEntry {
  rank: number;
  userId: string;
  username: string;
  wins: number;
  totalGames: number;
  averageGuesses: number;
  averagePercentDiff: number;
  totalScore: number;
}

type LeaderboardEntry = DailyEntry | AllTimeEntry;

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [type, setType] = useState<"daily" | "alltime">("daily");
  const [userRank, setUserRank] = useState<number | undefined>();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?type=${type}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setEntries(json.data.entries);
          setUserRank(json.data.userRank);
          setIsDemoMode(json.data.isDemoMode ?? false);
        }
      })
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="flex justify-center w-full">
      <main className="min-h-screen flex flex-col p-2 sm:p-4 w-full max-w-[96vw]">
      <header className="flex flex-col gap-0.5 mb-3 sm:mb-6">
        <div className="flex justify-between items-center min-h-9 sm:min-h-11">
          <Link href="/" className="text-base sm:text-lg lg:text-2xl font-bold text-[#1a1a1b] py-1 -my-1 sm:py-2 sm:-my-2 min-h-[36px] sm:min-h-[44px] flex items-center">
            🃏 Hold&apos;emle 🃏
          </Link>
          <Link href="/" className="text-xs sm:text-base lg:text-xl text-gray-600 hover:text-[#1a1a1b] py-1 sm:py-2 min-h-[36px] sm:min-h-[44px] flex items-center">
            ← Back
          </Link>
        </div>
      </header>

      <h1 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-3 sm:mb-4">Leaderboard</h1>

      <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-4">
        <button
          onClick={() => setType("daily")}
          className={`min-h-[36px] sm:min-h-[40px] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base lg:text-lg rounded-lg font-medium [touch-action:manipulation] ${
            type === "daily" ? "bg-[#6aaa64] text-white" : "bg-[#f6f7f8] border border-[#d3d6da]"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setType("alltime")}
          className={`min-h-[36px] sm:min-h-[40px] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base lg:text-lg rounded-lg font-medium [touch-action:manipulation] ${
            type === "alltime" ? "bg-[#6aaa64] text-white" : "bg-[#f6f7f8] border border-[#d3d6da]"
          }`}
        >
          All Time
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600 text-xs sm:text-base lg:text-xl">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-600 text-xs sm:text-base lg:text-xl">
          {isDemoMode
            ? "Login and play to see the leaderboard."
            : "No entries yet. Be the first to complete today's puzzle!"}
        </p>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {entries.map((e) => (
            <div
              key={e.userId + e.rank}
              className={`flex flex-col gap-0.5 sm:gap-1 p-2 sm:p-3 rounded-lg border border-[#d3d6da] ${
                userRank && e.rank === userRank
                  ? "bg-[#6aaa64]/15 border-2 border-[#6aaa64]"
                  : "bg-[#f6f7f8]"
              }`}
            >
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base lg:text-xl">
                <span className="font-semibold shrink-0">#{e.rank}</span>
                <span className="min-w-0 truncate font-medium">{e.username}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-6 gap-y-0 text-xs sm:text-base lg:text-xl text-gray-600">
                {type === "daily" ? (
                  <>
                    <span
                      className={
                        (e as DailyEntry).isSolved
                          ? "text-[#6aaa64] font-bold"
                          : "text-gray-600 font-bold"
                      }
                    >
                      {(e as DailyEntry).isSolved ? "WIN" : "LOSS"}
                    </span>
                    <span>
                      Guesses: {(e as DailyEntry).guessesUsed}/{MAX_GUESSES}
                    </span>
                    <span>
                      Time: {formatTime((e as DailyEntry).timeInSeconds)}
                    </span>
                    {(e as DailyEntry).percentDiff > 0 && (
                      <span>Difference: Δ{(e as DailyEntry).percentDiff.toFixed(0)}%</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="font-medium text-[#1a1a1b]">
                      Wins: {(e as AllTimeEntry).wins} / Games: {(e as AllTimeEntry).totalGames}
                    </span>
                    <span>
                      Avg guesses: {((e as AllTimeEntry).averageGuesses ?? 0).toFixed(1)}
                    </span>
                    <span>Avg diff: Δ{((e as AllTimeEntry).averagePercentDiff ?? 0).toFixed(0)}%</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {userRank && (
        <p className="mt-4 sm:mt-6 text-center text-[#6aaa64] font-medium text-xs sm:text-base lg:text-xl">
          Your rank: #{userRank}
        </p>
      )}
    </main>
    </div>
  );
}
