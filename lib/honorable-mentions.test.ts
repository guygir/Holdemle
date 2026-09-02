import { describe, it, expect } from "vitest";
import {
  buildHonorableMention,
  formatMentionDate,
  guessedPercentsByPosition,
  monthAgoDateUtc,
} from "./honorable-mentions";

describe("guessedPercentsByPosition", () => {
  it("reads percents from the first attempt", () => {
    const map = guessedPercentsByPosition([
      {
        attempt: 1,
        guesses: [
          { position: 1, percent: 40 },
          { position: 2, percent: 35 },
          { position: 3, percent: 25 },
        ],
      },
    ]);
    expect(map.get(1)).toBe(40);
    expect(map.get(2)).toBe(35);
    expect(map.get(3)).toBe(25);
  });

  it("returns empty map for missing history", () => {
    expect(guessedPercentsByPosition(null).size).toBe(0);
    expect(guessedPercentsByPosition([]).size).toBe(0);
  });
});

describe("buildHonorableMention", () => {
  const hands = [
    { position: 2, cards: ["Qc", "Jd"], actualPercent: 45 },
    { position: 1, cards: ["6d", "4d"], actualPercent: 22 },
    { position: 3, cards: ["9h", "7h"], actualPercent: 33 },
  ];

  it("uses first-guess percents and sorts hands by position", () => {
    const mention = buildHonorableMention({
      nickname: "Uno king 6",
      puzzleDate: "2026-09-01",
      submittedAt: "2026-09-01T03:21:44.055379+00:00",
      hands,
      guessHistory: [
        {
          attempt: 1,
          guesses: [
            { position: 1, percent: 22 },
            { position: 2, percent: 45 },
            { position: 3, percent: 33 },
          ],
        },
      ],
    });
    expect(mention).toEqual({
      nickname: "Uno king 6",
      date: "2026-09-01",
      submittedAt: "2026-09-01T03:21:44.055379+00:00",
      flop: null,
      hands: [
        { position: 1, cards: ["6d", "4d"], percent: 22 },
        { position: 2, cards: ["Qc", "Jd"], percent: 45 },
        { position: 3, cards: ["9h", "7h"], percent: 33 },
      ],
    });
  });

  it("falls back to actual percents and includes flop", () => {
    const mention = buildHonorableMention({
      nickname: "Nk",
      puzzleDate: "2026-03-12",
      submittedAt: "2026-03-12T12:00:00.000Z",
      hands,
      flop: ["Th", "9h", "2d"],
    });
    expect(mention?.flop).toEqual(["Th", "9h", "2d"]);
    expect(mention?.hands.map((h) => h.percent)).toEqual([22, 45, 33]);
  });

  it("returns null when a hand is missing cards", () => {
    expect(
      buildHonorableMention({
        nickname: "x",
        puzzleDate: "2026-09-01",
        submittedAt: "2026-09-01T00:00:00Z",
        hands: [{ position: 1, actualPercent: 50 }],
      })
    ).toBeNull();
  });
});

describe("monthAgoDateUtc", () => {
  it("is 30 UTC days before the given instant", () => {
    expect(monthAgoDateUtc(new Date("2026-09-01T15:00:00Z"))).toBe("2026-08-02");
  });
});

describe("formatMentionDate", () => {
  it("formats YYYY-MM-DD in UTC", () => {
    expect(formatMentionDate("2026-09-01")).toBe("Sep 1, 2026");
  });
});
