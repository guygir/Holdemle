"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MAX_GUESSES } from "@/lib/game-config";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

interface StatsData {
  totalGames: number;
  solvedDistribution: Record<string, number>;
  failedGames: number;
  currentStreak: number;
  maxStreak: number;
  averageGuesses: number;
  averagePercentDiff: number;
  lastPlayedDate: string | null;
  recentGames: Array<{
    date: string;
    guessesUsed: number;
    isSolved: boolean;
    timeInSeconds: number;
    percentDiff: number;
  }>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setStats(json.data);
        } else {
          setError(json.error || "Failed to load stats");
        }
      })
      .catch(() => setError("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

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

      <h1 className="text-2xl lg:text-3xl font-bold mb-6">Your Statistics</h1>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <div>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/auth/login"
            className="text-[#6aaa64] hover:underline min-h-[44px] inline-flex items-center"
          >
            Login to view stats
          </Link>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#f6f7f8] rounded-lg">
              <p className="text-sm lg:text-base text-gray-600">Total Games</p>
              <p className="text-2xl lg:text-3xl font-bold">{stats.totalGames}</p>
            </div>
            <div className="p-4 bg-[#f6f7f8] rounded-lg">
              <p className="text-sm lg:text-base text-gray-600">Current Streak</p>
              <p className="text-2xl lg:text-3xl font-bold">{stats.currentStreak}</p>
            </div>
            <div className="p-4 bg-[#f6f7f8] rounded-lg">
              <p className="text-sm lg:text-base text-gray-600">Max Streak</p>
              <p className="text-2xl lg:text-3xl font-bold">{stats.maxStreak}</p>
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Solved In</h2>
            <div className="flex gap-4 text-sm lg:text-base flex-wrap">
              {Array.from({ length: MAX_GUESSES }, (_, i) => i + 1).map(
                (n) => (
                  <span key={n}>
                    {n} guess{n > 1 ? "es" : ""}:{" "}
                    {(stats.solvedDistribution ?? {})[String(n)] ?? 0}
                  </span>
                )
              )}
              <span className="text-gray-500">Failed: {stats.failedGames}</span>
            </div>
          </div>

          {stats.averagePercentDiff > 0 && (
            <div className="p-4 bg-[#f6f7f8] rounded-lg">
              <p className="text-sm lg:text-base text-gray-600">Avg % diff (lower = better)</p>
              <p className="text-2xl lg:text-3xl font-bold">
                {stats.averagePercentDiff.toFixed(1)}
              </p>
            </div>
          )}

          {stats.totalGames > 0 && (
            <div>
              <p className="text-sm lg:text-base text-gray-600">
                Average guesses to solve:{" "}
                {stats.averageGuesses.toFixed(1)}
              </p>
            </div>
          )}

          {stats.recentGames.length > 0 && (
            <div>
              <h2 className="font-semibold mb-2">Recent Games</h2>
              <div className="space-y-2">
                {stats.recentGames.map((g, i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#f6f7f8] rounded-lg flex flex-col gap-1"
                  >
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm lg:text-base">
                      <span className="font-medium">
                        {g.isSolved ? (
                          <span className="text-[#6aaa64]">Won</span>
                        ) : (
                          <span className="text-gray-500">Failed</span>
                        )}
                      </span>
                      <span className="text-gray-600">
                        {g.guessesUsed}/{MAX_GUESSES} guesses
                      </span>
                      <span className="text-gray-600">
                        {formatTime(g.timeInSeconds)}
                      </span>
                      {g.percentDiff > 0 && (
                        <span className="text-gray-600">
                          Δ{g.percentDiff.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <span className="text-sm lg:text-base text-gray-500">{g.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </main>
  );
}
