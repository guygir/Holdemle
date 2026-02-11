import { describe, it, expect } from "vitest";
import { calculateScore } from "./scoring";

describe("calculateScore", () => {
  it("gives 300+ base for 1 guess", () => {
    const score = calculateScore(1, 0);
    expect(score).toBeGreaterThanOrEqual(300);
    expect(score).toBeLessThanOrEqual(400);
  });

  it("gives 200+ base for 2 guesses", () => {
    const score = calculateScore(2, 0);
    expect(score).toBeGreaterThanOrEqual(200);
  });

  it("gives 100+ base for 3 guesses", () => {
    const score = calculateScore(3, 0);
    expect(score).toBeGreaterThanOrEqual(100);
  });

  it("time bonus decays over 5 minutes", () => {
    const scoreAt0 = calculateScore(1, 0);
    const scoreAt300 = calculateScore(1, 300);
    expect(scoreAt0).toBeGreaterThan(scoreAt300);
    expect(scoreAt300).toBe(300); // base 300 + 0 time bonus
  });

  it("returns base + time bonus for typical case", () => {
    const score = calculateScore(2, 60);
    expect(score).toBe(200 + Math.max(0, Math.floor(100 - 60 / 3)));
  });
});
