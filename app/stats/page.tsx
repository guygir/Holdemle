"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MAX_GUESSES } from "@/lib/game-config";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
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
    <div className="flex justify-center w-full">
      <main className="min-h-screen flex flex-col p-2 sm:p-4 w-full max-w-[96vw]">
      <header className="flex justify-between items-center mb-3 sm:mb-6 min-h-9 sm:min-h-11">
        <Link href="/" className="text-base sm:text-lg lg:text-2xl font-bold text-[#1a1a1b] py-1 -my-1 sm:py-2 sm:-my-2 min-h-[36px] sm:min-h-[44px] flex items-center">
          🃏 Hold&apos;emle 🃏
        </Link>
        <Link href="/" className="text-xs sm:text-base lg:text-xl text-gray-600 hover:text-[#1a1a1b] py-1 sm:py-2 min-h-[36px] sm:min-h-[44px] flex items-center">
          ← Back
        </Link>
      </header>

      <h1 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-3 sm:mb-4">Your Statistics</h1>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <div>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/auth/login?redirect=/stats"
            className="text-[#6aaa64] hover:underline min-h-[44px] inline-flex items-center"
          >
            Login to view stats
          </Link>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="p-2 sm:p-4 bg-[#f6f7f8] rounded-lg">
              <p className="text-xs sm:text-sm lg:text-base text-gray-600">Total Games</p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold">{stats.totalGames}</p>
            </div>
            <div className="p-2 sm:p-4 bg-[#f6f7f8] rounded-lg">
              <p className="text-xs sm:text-sm lg:text-base text-gray-600">Current Streak</p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold">{stats.currentStreak}</p>
            </div>
            <div className="p-2 sm:p-4 bg-[#f6f7f8] rounded-lg">
              <p className="text-xs sm:text-sm lg:text-base text-gray-600">Max Streak</p>
              <p className="text-lg sm:text-2xl lg:text-3xl font-bold">{stats.maxStreak}</p>
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-2">Solved In</h2>
            <div className="flex items-end gap-1 sm:gap-2" style={{ minHeight: "80px" }}>
              {(() => {
                const dist = stats.solvedDistribution ?? {};
                const failed = stats.failedGames ?? 0;
                const counts = Array.from({ length: MAX_GUESSES }, (_, i) => dist[String(i + 1)] ?? 0);
                const maxCount = Math.max(...counts, failed, 1);
                return (
                  <>
                    {Array.from({ length: MAX_GUESSES }, (_, i) => {
                      const n = i + 1;
                      const count = counts[i];
                      const h = maxCount > 0 ? Math.max(8, (count / maxCount) * 48) : 0;
                      return (
                        <div key={n} className="flex flex-col items-center flex-1">
                          <span className="text-[10px] sm:text-xs mb-0.5 font-medium text-[#6aaa64]">{count}</span>
                          <div
                            className="w-full rounded-t bg-[#6aaa64] min-h-[4px]"
                            style={{ height: `${h}px` }}
                            title={`${n} guess${n > 1 ? "es" : ""}: ${count}`}
                          />
                          <span className="text-[10px] sm:text-xs mt-1 text-[#6aaa64] font-medium">{n}</span>
                        </div>
                      );
                    })}
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-[10px] sm:text-xs mb-0.5 font-medium text-[#dc2626]">{failed}</span>
                      <div
                        className="w-full rounded-t bg-[#dc2626] min-h-[4px]"
                        style={{
                          height: `${maxCount > 0 ? Math.max(8, (failed / maxCount) * 48) : 0}px`,
                        }}
                        title={`Loss: ${failed}`}
                      />
                      <span className="text-[10px] sm:text-xs mt-1 text-[#dc2626] font-medium">LOSS</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="space-y-2">
            {stats.averagePercentDiff > 0 && (
              <div className="p-2 sm:p-4 bg-[#f6f7f8] rounded-lg">
                <p className="text-xs sm:text-sm lg:text-base text-gray-600">Avg % diff</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold">
                  {stats.averagePercentDiff.toFixed(1)}
                </p>
              </div>
            )}

            {stats.totalGames > 0 && (
              <div className="p-2 sm:p-4 bg-[#f6f7f8] rounded-lg">
                <p className="text-xs sm:text-sm lg:text-base text-gray-600">Average guesses to solve</p>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold">
                  {stats.averageGuesses.toFixed(1)}
                </p>
              </div>
            )}
          </div>

          {stats.recentGames.length > 0 && (
            <div>
              <h2 className="font-semibold mb-2">Recent Games</h2>
              <div className="space-y-2">
                {stats.recentGames.map((g, i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#f6f7f8] rounded-lg flex flex-col gap-0.5"
                  >
                    <p className="text-sm lg:text-base font-medium">
                      <span className={g.isSolved ? "text-[#6aaa64] font-bold" : "text-[#dc2626] font-bold"}>
                        {g.isSolved ? "WON" : "LOSS"}
                      </span>
                      , Guesses: {g.guessesUsed}/{MAX_GUESSES}, Time: {formatTime(g.timeInSeconds)}, Diff: Δ{g.percentDiff.toFixed(0)}%
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">{g.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </main>
    </div>
  );
}
