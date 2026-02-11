const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"] as const;
const SUITS = ["s", "h", "d", "c"] as const; // spades, hearts, diamonds, clubs

export type CardCode = `${(typeof RANKS)[number]}${(typeof SUITS)[number]}`;

export function createDeck(excludeCards: string[] = []): CardCode[] {
  const deck: CardCode[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      const card = `${rank}${suit}` as CardCode;
      if (!excludeCards.includes(card)) {
        deck.push(card);
      }
    }
  }
  return deck;
}

export function shuffleDeck<T>(deck: T[]): T[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function cardToDisplay(card: string): string {
  const suitMap: Record<string, string> = {
    s: "♠",
    h: "♥",
    d: "♦",
    c: "♣",
  };
  const rankMap: Record<string, string> = {
    T: "10",
    J: "J",
    Q: "Q",
    K: "K",
    A: "A",
  };
  const rank = card[0];
  const suit = card[1];
  return `${rankMap[rank] || rank}${suitMap[suit] || suit}`;
}

export function isRedSuit(card: string): boolean {
  const suit = card[1];
  return suit === "h" || suit === "d";
}
