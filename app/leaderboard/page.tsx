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
    <main className="min-h-screen p-4 sm:p-6 max-w-lg mx-auto">
      <header className="flex justify-between items-center mb-6 min-h-11">
        <Link href="/" className="text-lg font-bold text-[#1a1a1b] py-2 -my-2 min-h-[44px] flex items-center">
          🃏 Poker Wordle
        </Link>
        <Link href="/game" className="text-sm text-[#6aaa64] hover:underline py-2 min-h-[44px] flex items-center">
          Play
        </Link>
      </header>

      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>

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
              className={`flex items-center justify-between p-3 rounded-lg gap-2 flex-wrap ${
                userRank && e.rank === userRank
                  ? "bg-[#6aaa64]/15 border-2 border-[#6aaa64]"
                  : "bg-[#f6f7f8]"
              }`}
            >
              <span className="font-semibold shrink-0">#{e.rank}</span>
              <span className="min-w-0 truncate">{e.username}</span>
              {type === "daily" ? (
                <div className="flex items-center gap-3 shrink-0 text-sm">
                  <span
                    className={
                      (e as DailyEntry).isSolved
                        ? "text-[#6aaa64] font-medium"
                        : "text-gray-500"
                    }
                  >
                    {(e as DailyEntry).isSolved ? "Win" : "Loss"}
                  </span>
                  <span className="text-gray-600">
                    {(e as DailyEntry).guessesUsed}/{MAX_GUESSES}
                  </span>
                  <span className="text-gray-600">
                    {formatTime((e as DailyEntry).timeInSeconds)}
                  </span>
                  {(e as DailyEntry).percentDiff > 0 && (
                    <span className="text-gray-500">
                      Δ{(e as DailyEntry).percentDiff.toFixed(0)}%
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 shrink-0 text-sm">
                  <span className="font-medium">
                    {(e as AllTimeEntry).wins}W / {(e as AllTimeEntry).totalGames}G
                  </span>
                  <span className="text-gray-600">
                    avg {(e as AllTimeEntry).averageGuesses.toFixed(1)} guesses
                  </span>
                  <span className="text-gray-600">
                    Δ{(e as AllTimeEntry).averagePercentDiff.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {userRank && (
        <p className="mt-6 text-center text-[#6aaa64] font-medium">
          Your rank: #{userRank}
        </p>
      )}
    </main>
  );
}
