"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MAX_GUESSES } from "@/lib/game-config";

interface StatsData {
  totalGames: number;
  solvedDistribution: Record<string, number>;
  failedGames: number;
  currentStreak: number;
  maxStreak: number;
  totalScore: number;
  averageGuesses: number;
  averagePercentDiff: number;
  lastPlayedDate: string | null;
  recentGames: Array<{
    date: string;
    score: number;
    guessesUsed: number;
    isSolved: boolean;
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
    <main className="min-h-screen p-4 sm:p-6 max-w-lg mx-auto">
      <header className="flex justify-between items-center mb-6 min-h-11">
        <Link href="/" className="text-lg font-bold text-[#1a1a1b] py-2 -my-2 min-h-[44px] flex items-center">
          🃏 Poker Wordle
        </Link>
        <Link href="/game" className="text-sm text-[#6aaa64] hover:underline py-2 min-h-[44px] flex items-center">
          Play
        </Link>
      </header>

      <h1 className="text-2xl font-bold mb-6">Your Statistics</h1>

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
              <p className="text-sm text-gray-600">Total Games</p>
              <p className="text-2xl font-bold">{stats.totalGames}</p>
            </div>
            <div className="p-4 bg-[#f6f7f8] rounded-lg">
              <p className="text-sm text-gray-600">Total Score</p>
              <p className="text-2xl font-bold">{stats.totalScore}</p>
            </div>
            <div className="p-4 bg-[#f6f7f8] rounded-lg">
              <p className="text-sm text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold">{stats.currentStreak}</p>
            </div>
            <div className="p-4 bg-[#f6f7f8] rounded-lg">
              <p className="text-sm text-gray-600">Max Streak</p>
              <p className="text-2xl font-bold">{stats.maxStreak}</p>
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Solved In</h2>
            <div className="flex gap-4 text-sm flex-wrap">
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
              <p className="text-sm text-gray-600">Avg % diff (lower = better)</p>
              <p className="text-2xl font-bold">
                {stats.averagePercentDiff.toFixed(1)}
              </p>
            </div>
          )}

          {stats.totalGames > 0 && (
            <div>
              <p className="text-sm text-gray-600">
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
                    className="flex justify-between p-2 bg-[#f6f7f8] rounded"
                  >
                    <span>{g.date}</span>
                    <span>
                      {g.isSolved ? (
                        <span className="text-[#6aaa64]">
                          {g.score} pts ({g.guessesUsed} guess
                          {g.guessesUsed > 1 ? "es" : ""})
                        </span>
                      ) : (
                        <span className="text-gray-500">Failed</span>
                      )}
                    </span>
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
