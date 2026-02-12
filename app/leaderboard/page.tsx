"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MAX_GUESSES } from "@/lib/game-config";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
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
    <main className="min-h-screen p-4 sm:p-6 max-w-lg lg:max-w-5xl xl:max-w-6xl 2xl:max-w-screen-2xl mx-auto">
      <header className="flex justify-between items-center mb-6 min-h-11">
        <Link href="/" className="text-lg lg:text-xl font-bold text-[#1a1a1b] py-2 -my-2 min-h-[44px] flex items-center">
          🃏 Poker Wordle
        </Link>
        <Link href="/game" className="text-sm lg:text-base text-[#6aaa64] hover:underline py-2 min-h-[44px] flex items-center">
          Play
        </Link>
      </header>

      <h1 className="text-2xl lg:text-3xl font-bold mb-4">Leaderboard</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setType("daily")}
          className={`min-h-[44px] px-4 py-2 rounded-lg font-medium [touch-action:manipulation] ${
            type === "daily" ? "bg-[#6aaa64] text-white" : "bg-[#f6f7f8]"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setType("alltime")}
          className={`min-h-[44px] px-4 py-2 rounded-lg font-medium [touch-action:manipulation] ${
            type === "alltime" ? "bg-[#6aaa64] text-white" : "bg-[#f6f7f8]"
          }`}
        >
          All Time
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-600">
          {isDemoMode
            ? "Login and play to see the leaderboard."
            : "No entries yet. Be the first to complete today's puzzle!"}
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div
              key={e.userId + e.rank}
              className={`flex flex-col gap-1 p-3 rounded-lg text-left ${
                userRank && e.rank === userRank
                  ? "bg-[#6aaa64]/15 border-2 border-[#6aaa64]"
                  : "bg-[#f6f7f8]"
              }`}
            >
              <div className="flex items-center gap-2 text-sm lg:text-base">
                <span className="font-semibold shrink-0">#{e.rank}</span>
                <span className="min-w-0 truncate">{e.username}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0 text-sm lg:text-base text-gray-600">
                {type === "daily" ? (
                  <>
                    <span
                      className={
                        (e as DailyEntry).isSolved
                          ? "text-[#6aaa64] font-medium"
                          : "text-gray-500"
                      }
                    >
                      {(e as DailyEntry).isSolved ? "Win" : "Loss"}
                    </span>
                    <span>
                      {(e as DailyEntry).guessesUsed}/{MAX_GUESSES}
                    </span>
                    <span>
                      {formatTime((e as DailyEntry).timeInSeconds)}
                    </span>
                    {(e as DailyEntry).percentDiff > 0 && (
                      <span>Δ{(e as DailyEntry).percentDiff.toFixed(0)}%</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="font-medium text-[#1a1a1b]">
                      {(e as AllTimeEntry).wins}W / {(e as AllTimeEntry).totalGames}G
                    </span>
                    <span>
                      avg {((e as AllTimeEntry).averageGuesses ?? 0).toFixed(1)} guesses
                    </span>
                    <span>Δ{((e as AllTimeEntry).averagePercentDiff ?? 0).toFixed(0)}%</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {userRank && (
        <p className="mt-6 text-center text-[#6aaa64] font-medium text-sm lg:text-base">
          Your rank: #{userRank}
        </p>
      )}
    </main>
  );
}
