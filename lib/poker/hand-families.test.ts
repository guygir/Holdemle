import { describe, it, expect } from "vitest";
import {
  pickHandFromFamily,
  generateFourHandsWithFamilies,
  DEFAULT_HAND_FAMILY_WEIGHTS,
  type HandFamily,
} from "./hand-families";

function cardFormat(c: string): boolean {
  const rank = c[0];
  const suit = c[1];
  return "23456789TJQKA".includes(rank) && "shdc".includes(suit);
}

describe("pickHandFromFamily", () => {
  it("returns valid cards for pocket_pairs", () => {
    const hand = pickHandFromFamily("pocket_pairs", new Set());
    expect(hand).not.toBeNull();
    expect(hand![0][0]).toBe(hand![1][0]);
    expect(hand![0][1]).not.toBe(hand![1][1]);
  });

  it("returns valid cards for all_ax", () => {
    const hand = pickHandFromFamily("all_ax", new Set());
    expect(hand).not.toBeNull();
    expect(hand![0][0] === "A" || hand![1][0] === "A").toBe(true);
  });

  it("excludes used cards", () => {
    const used = new Set(["As", "Ah", "Ad", "Ac"]);
    const hand = pickHandFromFamily("all_ax", used);
    expect(hand).toBeNull();
  });

  it("returns valid cards for connectors", () => {
    const hand = pickHandFromFamily("connectors", new Set());
    expect(hand).not.toBeNull();
  });
});

describe("generateFourHandsWithFamilies", () => {
  it("returns 4 hands", () => {
    const hands = generateFourHandsWithFamilies();
    expect(hands).not.toBeNull();
    expect(hands!.length).toBe(4);
  });

  it("all 8 cards are unique", () => {
    const hands = generateFourHandsWithFamilies()!;
    const cards = hands.flat();
    expect(new Set(cards).size).toBe(8);
  });

  it("all cards are valid format", () => {
    const hands = generateFourHandsWithFamilies()!;
    hands.flat().forEach((c) => {
      expect(cardFormat(c)).toBe(true);
      expect(c.length).toBe(2);
    });
  });
});
