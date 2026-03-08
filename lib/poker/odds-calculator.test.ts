import { describe, it, expect } from "vitest";
import { roundToSum100 } from "./odds-calculator";

describe("roundToSum100", () => {
  it("returns values summing to 100 for 4 hands", () => {
    const odds = [24.7, 31.2, 18.9, 25.2];
    const result = roundToSum100(odds);
    expect(result.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("returns values summing to 100 for 3 hands", () => {
    const odds = [33.3, 33.3, 33.4];
    const result = roundToSum100(odds);
    expect(result.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("returns values summing to 100 for 5 hands", () => {
    const odds = [20.1, 20.2, 20.3, 19.8, 19.6];
    const result = roundToSum100(odds);
    expect(result.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("returns integers", () => {
    const odds = [24.7, 31.2, 18.9, 25.2];
    const result = roundToSum100(odds);
    result.forEach((n) => expect(Number.isInteger(n)).toBe(true));
  });

  it("handles edge case where sum adjustment needed", () => {
    const odds = [25, 25, 25, 25];
    const result = roundToSum100(odds);
    expect(result.reduce((a, b) => a + b, 0)).toBe(100);
  });
});
