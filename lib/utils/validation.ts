export function validateGuesses(
  guesses: Array<{ position: number; percent: number }>
): { valid: boolean; error?: string } {
  if (guesses.length !== 4) {
    return { valid: false, error: "Must have exactly 4 guesses" };
  }

  const total = guesses.reduce((sum, g) => sum + g.percent, 0);
  if (total !== 100) {
    return {
      valid: false,
      error: `Percentages must sum to 100% (got ${total}%)`,
    };
  }

  for (const g of guesses) {
    if (g.percent < 0 || g.percent > 100 || !Number.isInteger(g.percent)) {
      return {
        valid: false,
        error: `Each percentage must be an integer between 0 and 100`,
      };
    }
  }

  return { valid: true };
}
