export const DECK_COLORS_KEY = "holdemle-deck-colors";
export type DeckColorScheme = "2-color" | "4-color";

/** Card code second char: s=spades, h=hearts, d=diamonds, c=clubs.
 * Returns hex color for inline style - bypasses any inherited text-white from parent. */
export function getCardColor(card: string, scheme: DeckColorScheme): string {
  const suit = card[1];
  if (scheme === "4-color") {
    switch (suit) {
      case "c":
        return "#16a34a";
      case "d":
        return "#2563eb";
      case "h":
        return "#dc2626";
      case "s":
      default:
        return "#000000";
    }
  }
  return suit === "h" || suit === "d" ? "#dc2626" : "#000000";
}
