import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getHandCountDistribution,
  sampleHandCountFromValue,
  sampleHandCount,
  resetHandCountDistributionCache,
  DEFAULT_HAND_COUNT_DISTRIBUTION,
  type HandCount,
} from "./puzzle-generation";

function cardFormat(c: string): boolean {
  const rank = c[0];
  const suit = c[1];
  return "23456789TJQKA".includes(rank) && "shdc".includes(suit);
}

describe("puzzle-generation", () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
    resetHandCountDistributionCache();
  });

  afterEach(() => {
    process.env = origEnv;
  });

  describe("getHandCountDistribution", () => {
    it("returns default distribution when env not set", () => {
      delete process.env.HAND_COUNT_DISTRIBUTION;
      resetHandCountDistributionCache();
      const dist = getHandCountDistribution();
      expect(dist).toEqual(DEFAULT_HAND_COUNT_DISTRIBUTION);
      expect(dist[3]).toBe(25);
      expect(dist[4]).toBe(60);
      expect(dist[5]).toBe(15);
      expect(dist[3] + dist[4] + dist[5]).toBe(100);
    });

    it("parses custom distribution from env", () => {
      process.env.HAND_COUNT_DISTRIBUTION = '{"3":10,"4":80,"5":10}';
      resetHandCountDistributionCache();
      const dist = getHandCountDistribution();
      expect(dist[3]).toBe(10);
      expect(dist[4]).toBe(80);
      expect(dist[5]).toBe(10);
    });

    it("falls back to defaults when sum is not 100", () => {
      process.env.HAND_COUNT_DISTRIBUTION = '{"3":33,"4":33,"5":33}';
      resetHandCountDistributionCache();
      const dist = getHandCountDistribution();
      expect(dist).toEqual(DEFAULT_HAND_COUNT_DISTRIBUTION);
    });

    it("falls back to defaults on invalid JSON", () => {
      process.env.HAND_COUNT_DISTRIBUTION = "invalid";
      resetHandCountDistributionCache();
      const dist = getHandCountDistribution();
      expect(dist).toEqual(DEFAULT_HAND_COUNT_DISTRIBUTION);
    });
  });

  describe("sampleHandCountFromValue", () => {
    const def: Record<HandCount, number> = { 3: 25, 4: 60, 5: 15 };

    it("returns 3 for values in [0, 25)", () => {
      expect(sampleHandCountFromValue(0, def)).toBe(3);
      expect(sampleHandCountFromValue(12, def)).toBe(3);
      expect(sampleHandCountFromValue(24.99, def)).toBe(3);
    });

    it("returns 4 for values in [25, 85)", () => {
      expect(sampleHandCountFromValue(25, def)).toBe(4);
      expect(sampleHandCountFromValue(50, def)).toBe(4);
      expect(sampleHandCountFromValue(84.99, def)).toBe(4);
    });

    it("returns 5 for values in [85, 100)", () => {
      expect(sampleHandCountFromValue(85, def)).toBe(5);
      expect(sampleHandCountFromValue(99, def)).toBe(5);
    });

    it("uses custom distribution when provided", () => {
      const custom: Record<HandCount, number> = { 3: 50, 4: 30, 5: 20 };
      expect(sampleHandCountFromValue(0, custom)).toBe(3);
      expect(sampleHandCountFromValue(49, custom)).toBe(3);
      expect(sampleHandCountFromValue(50, custom)).toBe(4);
      expect(sampleHandCountFromValue(79, custom)).toBe(4);
      expect(sampleHandCountFromValue(80, custom)).toBe(5);
    });
  });

  describe("sampleHandCount distribution", () => {
    it("produces roughly correct distribution over many samples", () => {
      const counts = { 3: 0, 4: 0, 5: 0 };
      const n = 10000;
      for (let i = 0; i < n; i++) {
        const h = sampleHandCount();
        counts[h]++;
      }
      // Allow ±5% tolerance
      expect(counts[3] / n).toBeGreaterThan(0.20);
      expect(counts[3] / n).toBeLessThan(0.30);
      expect(counts[4] / n).toBeGreaterThan(0.55);
      expect(counts[4] / n).toBeLessThan(0.65);
      expect(counts[5] / n).toBeGreaterThan(0.10);
      expect(counts[5] / n).toBeLessThan(0.20);
    });
  });
});
