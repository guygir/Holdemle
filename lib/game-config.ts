/**
 * Central game configuration. Change MAX_GUESSES here to adjust the game;
 * all code should reference this constant instead of hardcoding.
 */
export const MAX_GUESSES = 3;

/** Base score for each guess count. Best guess (1) gets highest, worst gets lowest. */
export function getBaseScore(guessesUsed: number): number {
  if (guessesUsed < 1 || guessesUsed > MAX_GUESSES) return 0;
  return (MAX_GUESSES - guessesUsed + 1) * 100;
}
