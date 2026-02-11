import { MAX_GUESSES } from "@/lib/game-config";

const EMOJI = {
  exact: "🟩",
  high: "🟦",
  low: "🟨",
} as const;

interface GuessWithFeedback {
  position: number;
  percent: number;
  feedback: "exact" | "high" | "low";
}

interface GuessAttempt {
  attempt: number;
  guesses: GuessWithFeedback[];
}

/**
 * Format results as Wordle-style share text.
 * Example:
 *   Poker Wordle 2026-02-11 2/3 ✓
 *   🟦🟩🟨🟨
 *   🟩🟩🟩🟩
 */
export function formatShareText(
  guessHistory: GuessAttempt[],
  date: string,
  isSolved: boolean,
  guessesUsed: number
): string {
  const lines: string[] = [];
  lines.push(
    `Poker Wordle ${date} ${guessesUsed}/${MAX_GUESSES} ${isSolved ? "✓" : "✗"}`
  );

  const orderedPositions = [1, 2, 3, 4];
  for (const attempt of guessHistory) {
    const byPosition = Object.fromEntries(
      attempt.guesses.map((g) => [g.position, g.feedback])
    );
    const emojiRow = orderedPositions
      .map((p) => EMOJI[byPosition[p] ?? "exact"])
      .join("");
    lines.push(emojiRow);
  }

  return lines.join("\n");
}
