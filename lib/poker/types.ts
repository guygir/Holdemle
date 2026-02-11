export type Suit = "♠" | "♥" | "♦" | "♣";
export type Rank =
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "T"
  | "J"
  | "Q"
  | "K"
  | "A";
export type Card = `${Rank}${Suit}`;

export interface PokerHand {
  position: number;
  cards: [Card, Card];
  actualPercent?: number;
}

export interface Puzzle {
  id: string;
  puzzleDate: string;
  hands: PokerHand[];
  difficulty: "easy" | "medium" | "hard";
}

export interface Guess {
  position: number;
  percent: number;
}

export type FeedbackType = "exact" | "high" | "low";

export interface GuessWithFeedback {
  position: number;
  percent: number;
  feedback: FeedbackType;
}

export interface GuessAttempt {
  attempt: number;
  guesses: GuessWithFeedback[];
}
