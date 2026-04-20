/**
 * Sum of |guessed − actual| over all hands for one attempt (same as submit route).
 */
export function computePercentDiff(
  feedback: Array<{ position: number; percent: number }>,
  actuals: Array<{ position: number; percent: number }>
): number {
  const actualMap = Object.fromEntries(
    actuals.map((a) => [a.position, a.percent])
  );
  return feedback.reduce(
    (sum, g) => sum + Math.abs(g.percent - (actualMap[g.position] ?? 0)),
    0
  );
}

type GuessHistoryAttempt = {
  guesses?: Array<{ position: number; percent: number }>;
};

/**
 * First attempt’s total |guess − actual| for a completed game’s guess_history JSON.
 */
export function firstGuessDiffFromHistory(
  guessHistory: unknown,
  hands: Array<{ position: number; actualPercent: number }>
): number | null {
  if (!Array.isArray(guessHistory) || guessHistory.length === 0) return null;
  const first = guessHistory[0] as GuessHistoryAttempt;
  const guesses = first?.guesses;
  if (!guesses?.length) return null;
  const feedback = guesses.map((g) => ({
    position: g.position,
    percent: g.percent,
  }));
  const actuals = hands.map((h) => ({
    position: h.position,
    percent: h.actualPercent,
  }));
  return computePercentDiff(feedback, actuals);
}
