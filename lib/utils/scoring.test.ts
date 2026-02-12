import { describe, it, expect } from "vitest";
import { calculateScore } from "./scoring";
import { getBaseScore, MAX_GUESSES } from "@/lib/game-config";

describe("calculateScore", () => {
  it("gives max base for 1 guess", () => {
    const score = calculateScore(1, 0);
    expect(score).toBeGreaterThanOrEqual(getBaseScore(1));
    expect(score).toBeLessThanOrEqual(getBaseScore(1) + 100);
  });

  it("gives expected base for 2 guesses", () => {
    const score = calculateScore(2, 0);
    expect(score).toBeGreaterThanOrEqual(getBaseScore(2));
  });

  it("gives min base for last guess", () => {
    const score = calculateScore(MAX_GUESSES, 0);
    expect(score).toBeGreaterThanOrEqual(getBaseScore(MAX_GUESSES));
  });

  it("time bonus decays over 5 minutes", () => {
    const scoreAt0 = calculateScore(1, 0);
    const scoreAt300 = calculateScore(1, 300);
    expect(scoreAt0).toBeGreaterThan(scoreAt300);
    expect(scoreAt300).toBe(getBaseScore(1)); // base + 0 time bonus at 300s
  });

  it("returns base + time bonus for typical case", () => {
    const score = calculateScore(2, 60);
    const timeBonus = Math.max(0, Math.floor(100 - 60 / 3));
    expect(score).toBe(getBaseScore(2) + timeBonus);
  });
});
