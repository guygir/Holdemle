/**
 * Helpers for solved_distribution JSONB in user_stats.
 * Format: { "1": 5, "2": 3, "3": 2 } = counts per guess count.
 * Scales with MAX_GUESSES - no schema change needed when changing guess count.
 */

export type SolvedDistribution = Record<string, number>;

/** Total wins = sum of all solve counts */
export function countWins(dist: SolvedDistribution | null | undefined): number {
  if (!dist || typeof dist !== "object") return 0;
  return Object.values(dist).reduce((s, n) => s + (typeof n === "number" ? n : 0), 0);
}

/** Average guesses to solve (only counts solved games). Returns 0 if no solves. */
export function getAverageGuessesFromSolvedDistribution(
  dist: SolvedDistribution | null | undefined
): number {
  const wins = countWins(dist);
  if (wins === 0) return 0;
  let sum = 0;
  for (const [n, count] of Object.entries(dist ?? {})) {
    const guesses = parseInt(n, 10);
    if (!isNaN(guesses) && typeof count === "number") {
      sum += guesses * count;
    }
  }
  return sum / wins;
}

/** Increment count for guessesUsed; returns new distribution */
export function incrementSolved(
  dist: SolvedDistribution | null | undefined,
  guessesUsed: number
): SolvedDistribution {
  const d = dist && typeof dist === "object" ? { ...dist } : {};
  const key = String(guessesUsed);
  d[key] = (d[key] ?? 0) + 1;
  return d;
}
