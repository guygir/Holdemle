declare module "pokersolver" {
  export class Hand {
    static solve(cards: string[]): Hand;
    static winners(hands: Hand[]): Hand[];
    getRank(): number;
    getValue(): number;
    cards: string[];
    descr: string;
    name: string;
  }
}
