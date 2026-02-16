/**
 * Benchmark: Monte Carlo (1M) vs Exhaustive enumeration.
 * Runs 10 trials with random 4-hand deals, shows timers and percentages.
 *
 * Run: npx tsx scripts/benchmark-equity-methods.ts
 */

import { Hand } from "pokersolver";
import { createDeck, shuffleDeck } from "../lib/poker/deck";

type Hand4 = [string, string][];

const MONTE_CARLO_ITERATIONS = 1_000_000;
const NUM_TRIALS = 10;

function pickRandom4Hands(): Hand4 {
  const deck = shuffleDeck(createDeck([]));
  const cards = deck.slice(0, 8);
  return [
    [cards[0], cards[1]],
    [cards[2], cards[3]],
    [cards[4], cards[5]],
    [cards[6], cards[7]],
  ];
}

function monteCarlo(hands: Hand4, iterations: number): number[] {
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

function exhaustiveSearch(hands: Hand4): number[] {
  const usedCards = hands.flat();
  const deck = createDeck(usedCards); // 44 cards, already in deterministic order
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

function formatPcts(pcts: number[]): string {
  return pcts.map((p) => p.toFixed(2)).join(" | ");
}

async function main() {
  console.log("Equity benchmark: Monte Carlo (1M) vs Exhaustive\n");
  console.log(`Running ${NUM_TRIALS} trials with random 4-hand deals.\n`);

  const sep = "-".repeat(110);
  console.log(sep);
  console.log(
    "Trial".padEnd(7) +
      "| Hands".padEnd(22) +
      "| MC(s)".padStart(8) +
      "| Exh(s)".padStart(8) +
      "| MC % (H1-H4)".padStart(36) +
      "| Exh % (H1-H4)"
  );
  console.log(sep);

  let mcTotal = 0;
  let exhTotal = 0;

  for (let t = 1; t <= NUM_TRIALS; t++) {
    const hands = pickRandom4Hands();
    const handLabels = hands.map((h) => `${h[0]}${h[1]}`).join(" ");

    const mcStart = performance.now();
    const mcPcts = monteCarlo(hands, MONTE_CARLO_ITERATIONS);
    const mcElapsed = (performance.now() - mcStart) / 1000;
    mcTotal += mcElapsed;

    const exhStart = performance.now();
    const exhPcts = exhaustiveSearch(hands);
    const exhElapsed = (performance.now() - exhStart) / 1000;
    exhTotal += exhElapsed;

    const mcStr = formatPcts(mcPcts);
    const exhStr = formatPcts(exhPcts);

    console.log(
      `#${t}`.padEnd(7) +
        "| " +
        handLabels.padEnd(20) +
        "| " +
        mcElapsed.toFixed(2).padStart(6) +
        "| " +
        exhElapsed.toFixed(2).padStart(6) +
        "| " +
        mcStr.padStart(34) +
        "| " +
        exhStr
    );
  }

  console.log(sep);
  console.log(
    "Avg".padEnd(7) +
      "| " +
      "".padEnd(20) +
      "| " +
      (mcTotal / NUM_TRIALS).toFixed(2).padStart(6) +
      "| " +
      (exhTotal / NUM_TRIALS).toFixed(2).padStart(6) +
      "| " +
      "-".padEnd(34) +
      "| -"
  );
  console.log(sep);
  console.log(`\nMonte Carlo: ${MONTE_CARLO_ITERATIONS.toLocaleString()} iterations`);
  console.log("Exhaustive: 1,086,008 boards (C(44,5))");
}

main().catch(console.error);
