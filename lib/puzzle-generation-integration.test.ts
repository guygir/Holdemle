/**
 * Integration tests for puzzle generation (no DB).
 * Verifies 3/4/5-hand puzzles are properly generated like the demos.
 */
import { describe, it, expect } from "vitest";
import {
  generateNHandsWithFamilies,
  DEFAULT_HAND_FAMILY_WEIGHTS,
} from "@/lib/poker/hand-families";
import {
  calculatePreFlopOddsExhaustive,
  roundToSum100,
} from "@/lib/poker/odds-calculator";

function cardFormat(c: string): boolean {
  const rank = c[0];
  const suit = c[1];
  return "23456789TJQKA".includes(rank) && "shdc".includes(suit);
}

describe("puzzle generation integration", { timeout: 120000 }, () => {
  for (const n of [3, 4, 5] as const) {
    describe(`${n}-hand puzzles`, () => {
      it("generates valid hands", () => {
        const hands = generateNHandsWithFamilies(n, DEFAULT_HAND_FAMILY_WEIGHTS);
        expect(hands).not.toBeNull();
        expect(hands!.length).toBe(n);
      });

      it("all cards are unique", () => {
        const hands = generateNHandsWithFamilies(n)!;
        const cards = hands.flat();
        expect(new Set(cards).size).toBe(n * 2);
      });

      it("all cards are valid format", () => {
        const hands = generateNHandsWithFamilies(n)!;
        hands.flat().forEach((c) => {
          expect(cardFormat(c)).toBe(true);
          expect(c.length).toBe(2);
        });
      });

      it("odds sum to 100 and are in valid range", () => {
        const hands = generateNHandsWithFamilies(n)!;
        const rawOdds = calculatePreFlopOddsExhaustive(hands);
        expect(rawOdds).toHaveLength(n);
        const rounded = roundToSum100(rawOdds);
        expect(rounded.reduce((a, b) => a + b, 0)).toBe(100);
        rounded.forEach((p) => {
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThanOrEqual(100);
        });
      });

      it("puzzle structure matches demo format", () => {
        const hands = generateNHandsWithFamilies(n)!;
        const rawOdds = calculatePreFlopOddsExhaustive(hands);
        const rounded = roundToSum100(rawOdds);
        const puzzleHands = hands.map((cards, idx) => ({
          position: idx + 1,
          cards,
          actualPercent: rounded[idx],
        }));
        expect(puzzleHands).toHaveLength(n);
        puzzleHands.forEach((ph, i) => {
          expect(ph.position).toBe(i + 1);
          expect(ph.cards).toHaveLength(2);
          expect(ph.actualPercent).toBe(rounded[i]);
        });
      });
    });
  }

  it("generates multiple puzzles without errors", { timeout: 360000 }, () => {
    for (let i = 0; i < 3; i++) {
      const n = (i % 3) + 3; // 3, 4, 5 (one per hand count)
      const hands = generateNHandsWithFamilies(n)!;
      const odds = calculatePreFlopOddsExhaustive(hands);
      const rounded = roundToSum100(odds);
      expect(rounded.reduce((a, b) => a + b, 0)).toBe(100);
    }
  });
});
