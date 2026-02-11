/**
 * Daily leaderboard sorting:
 * 1. Win (1) before Loss (0)
 * 2. For winners: fewer guesses better, then less time better
 * 3. For losers: less % diff better
 */
export function sortDailyLeaderboard<
  T extends {
    user_id: string;
    is_solved: boolean;
    guesses_used: number;
    time_taken_seconds: number;
    percent_diff?: number | null;
  }
>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    if (a.is_solved !== b.is_solved) return a.is_solved ? -1 : 1;
    if (a.is_solved) {
      if (a.guesses_used !== b.guesses_used)
        return a.guesses_used - b.guesses_used;
      return a.time_taken_seconds - b.time_taken_seconds;
    }
    const diffA = a.percent_diff ?? 999;
    const diffB = b.percent_diff ?? 999;
    return diffA - diffB;
  });
}
