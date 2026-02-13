import { MAX_GUESSES } from "@/lib/game-config";

const EMOJI = {
  exact: "🟩",
  high: "🟦",
  low: "🟧", // orange, matches site #f5793a
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
 *   Hold'emle 2026-02-11 2/3 ✓
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
  lines.push("Hold'emle");
  lines.push(date);
  lines.push(
    `I ${isSolved ? "Won" : "Lost"}, using ${guessesUsed}/${MAX_GUESSES} guesses.`
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://holdemle.vercel.app";
  lines.push("");
  lines.push(`Visit ${appUrl}/ for daily poker puzzles!`);

  return lines.join("\n");
}
