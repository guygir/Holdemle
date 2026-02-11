import { describe, it, expect } from "vitest";
import {
  countWins,
  incrementSolved,
  getAverageGuessesFromSolvedDistribution,
} from "./solved-distribution";

describe("countWins", () => {
  it("returns 0 for null/undefined", () => {
    expect(countWins(null)).toBe(0);
    expect(countWins(undefined)).toBe(0);
  });

  it("sums all values in distribution", () => {
    expect(countWins({ "1": 5, "2": 3, "3": 2 })).toBe(10);
  });

  it("returns 0 for empty object", () => {
    expect(countWins({})).toBe(0);
  });
});

describe("incrementSolved", () => {
  it("adds new key when empty", () => {
    const result = incrementSolved({}, 2);
    expect(result).toEqual({ "2": 1 });
  });

  it("increments existing key", () => {
    const result = incrementSolved({ "2": 3 }, 2);
    expect(result).toEqual({ "2": 4 });
  });

  it("handles null/undefined as empty", () => {
    const result = incrementSolved(null, 1);
    expect(result).toEqual({ "1": 1 });
  });
});

describe("getAverageGuessesFromSolvedDistribution", () => {
  it("returns 0 for null/undefined/empty", () => {
    expect(getAverageGuessesFromSolvedDistribution(null)).toBe(0);
    expect(getAverageGuessesFromSolvedDistribution(undefined)).toBe(0);
    expect(getAverageGuessesFromSolvedDistribution({})).toBe(0);
  });

  it("computes weighted average from distribution", () => {
    expect(getAverageGuessesFromSolvedDistribution({ "1": 5, "2": 3, "3": 2 })).toBeCloseTo(
      (1 * 5 + 2 * 3 + 3 * 2) / 10
    );
  });
});
