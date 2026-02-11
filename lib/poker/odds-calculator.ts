import { Hand } from "pokersolver";
import { createDeck, shuffleDeck } from "./deck";

/**
 * Calculate pre-flop winning percentages for 4 hands.
 * Uses poker-odds-calc exhaustive mode (exact, ~5s) when available.
 * Falls back to Monte Carlo (pokersolver) for other cases.
 */
export async function calculatePreFlopOdds(
  hands: Array<[string, string]>,
  iterations: number = 10000
): Promise<number[]> {
  // Prefer poker-odds-calc exhaustive (exact) for exactly 4 hands - only in Node (scripts)
  if (hands.length === 4 && typeof window === "undefined") {
    try {
      const { TexasHoldem } = await import("poker-odds-calc");
      const table = new TexasHoldem();
      hands.forEach((h) => table.addPlayer([h[0], h[1]]));
      table.exhaustive();
      const result = table.calculate();
      return result.getPlayers().map((p) => p.getWinsPercentage());
    } catch {
      // Fall through to Monte Carlo
    }
  }

  // Monte Carlo fallback
  const wins = new Array(hands.length).fill(0);
  for (let i = 0; i < iterations; i++) {
    const usedCards = hands.flat();
    const deck = shuffleDeck(createDeck(usedCards));
    const board = deck.slice(0, 5);

    const handResults = hands.map((holeCards) =>
      Hand.solve([...holeCards, ...board])
    );

    const winners = Hand.winners(handResults);
    const winShare = 1 / winners.length;

    winners.forEach((winner) => {
      const idx = handResults.indexOf(winner);
      wins[idx] += winShare;
    });
  }

  return hands.map((_, i) => (wins[i] / iterations) * 100);
}

/**
 * Round odds to integers that sum to exactly 100.
 * Strategy: Round down the 2 closest to floor, round up the other 2.
 */
export function roundToSum100(odds: number[]): number[] {
  if (odds.length !== 4) {
    throw new Error("roundToSum100 requires exactly 4 values");
  }

  const distances = odds.map((odd, i) => ({
    index: i,
    value: odd,
    distanceToFloor: odd - Math.floor(odd),
  }));

  distances.sort((a, b) => a.distanceToFloor - b.distanceToFloor);

  const rounded = odds.map((odd, i) => {
    const shouldRoundDown = distances.slice(0, 2).some((d) => d.index === i);
    return shouldRoundDown ? Math.floor(odd) : Math.ceil(odd);
  });

  const sum = rounded.reduce((a, b) => a + b, 0);
  if (sum !== 100) {
    // Fallback: adjust the largest value
    const diff = 100 - sum;
    const maxIdx = rounded.indexOf(Math.max(...rounded));
    rounded[maxIdx] += diff;
  }

  return rounded;
}
