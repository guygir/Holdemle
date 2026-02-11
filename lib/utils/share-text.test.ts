import { describe, it, expect } from "vitest";
import { formatShareText } from "./share-text";

describe("formatShareText", () => {
  it("includes date and guesses", () => {
    const text = formatShareText(
      [
        {
          attempt: 1,
          guesses: [
            { position: 1, percent: 30, feedback: "exact" as const },
            { position: 2, percent: 38, feedback: "exact" as const },
            { position: 3, percent: 17, feedback: "exact" as const },
            { position: 4, percent: 15, feedback: "exact" as const },
          ],
        },
      ],
      "2026-02-11",
      true,
      1
    );
    expect(text).toContain("Poker Wordle");
    expect(text).toContain("2026-02-11");
    expect(text).toContain("1/3");
    expect(text).toContain("✓");
  });

  it("includes emoji rows for each attempt", () => {
    const text = formatShareText(
      [
        {
          attempt: 1,
          guesses: [
            { position: 1, percent: 30, feedback: "high" as const },
            { position: 2, percent: 38, feedback: "exact" as const },
            { position: 3, percent: 17, feedback: "low" as const },
            { position: 4, percent: 15, feedback: "low" as const },
          ],
        },
      ],
      "2026-02-11",
      false,
      1
    );
    expect(text).toContain("✗");
    expect(text).toContain("🟦");
    expect(text).toContain("🟩");
    expect(text).toContain("🟨");
  });
});
