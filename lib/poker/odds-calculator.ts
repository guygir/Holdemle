import { Hand } from "pokersolver";
import { createDeck, shuffleDeck } from "./deck";

/**
 * Calculate pre-flop equity percentages for 4 hands using exhaustive enumeration.
 * Enumerates all C(44,5) = 1,086,008 possible boards. Exact equity, ~same runtime as 1M Monte Carlo.
 * Correctly splits ties (1/numWinners per board).
 */
export function calculatePreFlopOddsExhaustive(
  hands: Array<[string, string]>
): number[] {
  const usedCards = hands.flat();
  const deck = createDeck(usedCards);
  const equity = new Array(hands.length).fill(0);
  let count = 0;

  const n = deck.length;
  for (let i0 = 0; i0 < n - 4; i0++) {
    for (let i1 = i0 + 1; i1 < n - 3; i1++) {
      for (let i2 = i1 + 1; i2 < n - 2; i2++) {
        for (let i3 = i2 + 1; i3 < n - 1; i3++) {
          for (let i4 = i3 + 1; i4 < n; i4++) {
            const board = [
              deck[i0],
              deck[i1],
              deck[i2],
              deck[i3],
              deck[i4],
            ];

            const handResults = hands.map((holeCards) =>
              Hand.solve([...holeCards, ...board])
            );
            const winners = Hand.winners(handResults);
            const winShare = 1 / winners.length;
            winners.forEach((winner) => {
              const idx = handResults.indexOf(winner);
              equity[idx] += winShare;
            });
            count++;
          }
        }
      }
    }
  }

  return hands.map((_, i) => (equity[i] / count) * 100);
}

/**
 * Calculate post-flop equity for hands given a known flop.
 * Enumerates all C(41,2) = 820 turn+river combinations. Exact equity.
 * Correctly splits ties (1/numWinners per board).
 */
export function calculatePostFlopOddsExhaustive(
  hands: Array<[string, string]>,
  flop: [string, string, string]
): number[] {
  const usedCards = [...hands.flat(), ...flop];
  const deck = createDeck(usedCards);
  const equity = new Array(hands.length).fill(0);
  let count = 0;

  const n = deck.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const turn = deck[i];
      const river = deck[j];
      const board = [...flop, turn, river];

      const handResults = hands.map((holeCards) =>
        Hand.solve([...holeCards, ...board])
      );
      const winners = Hand.winners(handResults);
      const winShare = 1 / winners.length;
      winners.forEach((winner) => {
        const idx = handResults.indexOf(winner);
        equity[idx] += winShare;
      });
      count++;
    }
  }

  return hands.map((_, i) => (equity[i] / count) * 100);
}

/**
 * Calculate pre-flop equity percentages for 4 hands.
 * Uses Monte Carlo (pokersolver) - 1M iterations in Node for accuracy.
 * Correctly splits ties (1/numWinners per board).
 */
export async function calculatePreFlopOdds(
  hands: Array<[string, string]>,
  iterations: number = 1_000_000
): Promise<number[]> {
  const equity = new Array(hands.length).fill(0);
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
      equity[idx] += winShare;
    });
  }

  return hands.map((_, i) => (equity[i] / iterations) * 100);
}

/**
 * Round odds to integers that sum to exactly 100.
 * Strategy: Round down values closest to floor, round up the rest.
 * Works with any number of hands (3, 4, 5, etc.)
 */
export function roundToSum100(odds: number[]): number[] {
  const n = odds.length;
  
  // Calculate how many to round down vs up
  const floorSum = odds.reduce((sum, odd) => sum + Math.floor(odd), 0);
  const numToRoundUp = 100 - floorSum;
  
  // Sort by distance to ceiling (those closest to ceiling should be rounded up)
  const distances = odds.map((odd, i) => ({
    index: i,
    value: odd,
    distanceToCeil: Math.ceil(odd) - odd,
  }));
  
  distances.sort((a, b) => a.distanceToCeil - b.distanceToCeil);
  
  // Round up the closest ones to ceiling, round down the rest
  const rounded = odds.map((odd, i) => {
    const shouldRoundUp = distances.slice(0, numToRoundUp).some((d) => d.index === i);
    return shouldRoundUp ? Math.ceil(odd) : Math.floor(odd);
  });
  
  // Verify sum is exactly 100
  const sum = rounded.reduce((a, b) => a + b, 0);
  if (sum !== 100) {
    // Fallback: adjust the largest value
    const diff = 100 - sum;
    const maxIdx = rounded.indexOf(Math.max(...rounded));
    rounded[maxIdx] += diff;
  }
  
  return rounded;
}
