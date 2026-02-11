import { describe, it, expect } from "vitest";
import { validateGuesses } from "./validation";

describe("validateGuesses", () => {
  it("accepts valid guesses summing to 100", () => {
    const result = validateGuesses([
      { position: 1, percent: 30 },
      { position: 2, percent: 38 },
      { position: 3, percent: 17 },
      { position: 4, percent: 15 },
    ]);
    expect(result.valid).toBe(true);
  });

  it("rejects when not exactly 4 guesses", () => {
    const result = validateGuesses([
      { position: 1, percent: 25 },
      { position: 2, percent: 25 },
      { position: 3, percent: 25 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("exactly 4");
  });

  it("rejects when sum is not 100", () => {
    const result = validateGuesses([
      { position: 1, percent: 25 },
      { position: 2, percent: 25 },
      { position: 3, percent: 25 },
      { position: 4, percent: 30 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("100");
  });

  it("rejects negative percentages", () => {
    const result = validateGuesses([
      { position: 1, percent: 50 },
      { position: 2, percent: 50 },
      { position: 3, percent: 0 },
      { position: 4, percent: -1 },
    ]);
    expect(result.valid).toBe(false);
  });

  it("rejects percentages over 100", () => {
    const result = validateGuesses([
      { position: 1, percent: 101 },
      { position: 2, percent: 0 },
      { position: 3, percent: 0 },
      { position: 4, percent: 0 },
    ]);
    expect(result.valid).toBe(false);
  });
});
