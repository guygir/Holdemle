import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getHandCountDistribution,
  getPuzzleTypeDistribution,
  samplePuzzleTypeFromValue,
  samplePuzzleType,
  resetHandCountDistributionCache,
  DEFAULT_PUZZLE_TYPE_DISTRIBUTION,
  type PuzzleType,
} from "./puzzle-generation";

describe("puzzle-generation", () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
    resetHandCountDistributionCache();
  });

  afterEach(() => {
    process.env = origEnv;
  });

  describe("getPuzzleTypeDistribution", () => {
    it("returns default distribution when env not set", () => {
      delete process.env.PUZZLE_TYPE_DISTRIBUTION;
      resetHandCountDistributionCache();
      const dist = getPuzzleTypeDistribution();
      expect(dist).toEqual(DEFAULT_PUZZLE_TYPE_DISTRIBUTION);
      expect(dist["3"] + dist["4"] + dist["5"] + dist["4flop"]).toBe(100);
    });

    it("parses custom distribution from env", () => {
      process.env.PUZZLE_TYPE_DISTRIBUTION = '{"3":10,"4":35,"5":15,"4flop":40}';
      resetHandCountDistributionCache();
      const dist = getPuzzleTypeDistribution();
      expect(dist["3"]).toBe(10);
      expect(dist["4"]).toBe(35);
      expect(dist["4flop"]).toBe(40);
    });

    it("falls back to defaults when sum is not 100", () => {
      process.env.PUZZLE_TYPE_DISTRIBUTION = '{"3":25,"4":25,"5":25,"4flop":24}';
      resetHandCountDistributionCache();
      const dist = getPuzzleTypeDistribution();
      expect(dist).toEqual(DEFAULT_PUZZLE_TYPE_DISTRIBUTION);
    });
  });

  describe("getHandCountDistribution", () => {
    it("returns preflop percentages (3, 4, 5)", () => {
      delete process.env.PUZZLE_TYPE_DISTRIBUTION;
      resetHandCountDistributionCache();
      const dist = getHandCountDistribution();
      expect(dist[3]).toBe(25);
      expect(dist[4]).toBe(35);
      expect(dist[5]).toBe(15);
    });
  });

  describe("samplePuzzleTypeFromValue", () => {
    const def: Record<PuzzleType, number> = { "3": 25, "4": 35, "5": 15, "4flop": 25 };

    it("returns 3 for values in [0, 25)", () => {
      expect(samplePuzzleTypeFromValue(0, def)).toBe("3");
      expect(samplePuzzleTypeFromValue(24.99, def)).toBe("3");
    });

    it("returns 4 for values in [25, 60)", () => {
      expect(samplePuzzleTypeFromValue(25, def)).toBe("4");
      expect(samplePuzzleTypeFromValue(59.99, def)).toBe("4");
    });

    it("returns 5 for values in [60, 75)", () => {
      expect(samplePuzzleTypeFromValue(60, def)).toBe("5");
      expect(samplePuzzleTypeFromValue(74.99, def)).toBe("5");
    });

    it("returns 4flop for values in [75, 100)", () => {
      expect(samplePuzzleTypeFromValue(75, def)).toBe("4flop");
      expect(samplePuzzleTypeFromValue(99, def)).toBe("4flop");
    });
  });

  describe("samplePuzzleType distribution", () => {
    it("produces roughly correct distribution over many samples", () => {
      const counts: Record<PuzzleType, number> = { "3": 0, "4": 0, "5": 0, "4flop": 0 };
      const n = 10000;
      for (let i = 0; i < n; i++) {
        counts[samplePuzzleType()]++;
      }
      expect(counts["3"] / n).toBeGreaterThan(0.20);
      expect(counts["3"] / n).toBeLessThan(0.30);
      expect(counts["4"] / n).toBeGreaterThan(0.30);
      expect(counts["4"] / n).toBeLessThan(0.40);
      expect(counts["5"] / n).toBeGreaterThan(0.10);
      expect(counts["5"] / n).toBeLessThan(0.20);
      expect(counts["4flop"] / n).toBeGreaterThan(0.20);
      expect(counts["4flop"] / n).toBeLessThan(0.30);
    });
  });
});
