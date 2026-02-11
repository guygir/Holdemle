import { getBaseScore } from "@/lib/game-config";

/**
 * Calculate score based on guesses used and time.
 * Base score: 1 guess = 300, 2 = 200, 3 = 100 (scales with MAX_GUESSES)
 * Time bonus: max 100, decays over 5 minutes (300 seconds)
 */
export function calculateScore(
  guessesUsed: number,
  timeInSeconds: number
): number {
  const baseScore = getBaseScore(guessesUsed);
  const timeBonus = Math.max(0, Math.floor(100 - timeInSeconds / 3));
  return baseScore + timeBonus;
}
