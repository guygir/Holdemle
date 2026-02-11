/**
 * Configurable hand families for puzzle generation.
 *
 * Card format: "As" = Ace of spades, "Kh" = King of hearts.
 * Suits: s=spades, h=hearts, d=diamonds, c=clubs.
 * Ranks: 2-9, T=10, J, Q, K, A.
 *
 * Hand notation: "K4s" = K4 suited, "K6o" = K6 offsuit.
 */

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const SUITS = ["s", "h", "d", "c"];

export type HandFamily =
  | "all_ax"
  | "k4s_k6o"
  | "q6s_q8o"
  | "j8s_j10o"
  | "connectors"
  | "suited_one_gappers"
  | "pocket_pairs"
  | "random";

/** Default weights for sampling families. Keys are HandFamily, values are relative weight. */
export const DEFAULT_HAND_FAMILY_WEIGHTS: Record<HandFamily, number> = {
  all_ax: 15,
  k4s_k6o: 12,
  q6s_q8o: 12,
  j8s_j10o: 10,
  connectors: 15,
  suited_one_gappers: 12,
  pocket_pairs: 18,
  random: 6,
};

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick one hand from family, excluding used cards. Returns null if none possible. */
export function pickHandFromFamily(
  family: HandFamily,
  exclude: Set<string>
): [string, string] | null {
  const candidates = getHandCandidates(family, exclude);
  if (candidates.length === 0) return null;
  return randomChoice(candidates);
}

function getHandCandidates(
  family: HandFamily,
  exclude: Set<string>
): [string, string][] {
  const out: [string, string][] = [];

  if (family === "all_ax") {
    for (const suit of SUITS) {
      const ace = `A${suit}`;
      if (exclude.has(ace)) continue;
      for (const rank of RANKS) {
        if (rank === "A") continue;
        for (const s2 of SUITS) {
          const c2 = `${rank}${s2}`;
          if (!exclude.has(c2) && c2 !== ace) out.push([ace, c2]);
        }
      }
    }
  }

  if (family === "k4s_k6o") {
    const kickersSuited = ["4", "5", "6", "7", "8", "9", "T", "J", "Q", "A"];
    const kickersOffsuit = ["6", "7", "8", "9", "T", "J", "Q", "A"];
    for (const suit of SUITS) {
      const k = `K${suit}`;
      if (exclude.has(k)) continue;
      for (const kr of kickersSuited) {
        const c2 = `${kr}${suit}`;
        if (kr !== "K" && !exclude.has(c2)) out.push([k, c2]);
      }
      for (const kr of kickersOffsuit) {
        for (const s2 of SUITS) {
          if (s2 === suit) continue;
          const c2 = `${kr}${s2}`;
          if (!exclude.has(c2) && kr !== "K") out.push([k, c2]);
        }
      }
    }
  }

  if (family === "q6s_q8o") {
    const kickersSuited = ["6", "7", "8", "9", "T", "J", "K", "A"];
    const kickersOffsuit = ["8", "9", "T", "J", "K", "A"];
    for (const suit of SUITS) {
      const q = `Q${suit}`;
      if (exclude.has(q)) continue;
      for (const kr of kickersSuited) {
        const c2 = `${kr}${suit}`;
        if (kr !== "Q" && !exclude.has(c2)) out.push([q, c2]);
      }
      for (const kr of kickersOffsuit) {
        for (const s2 of SUITS) {
          if (s2 === suit) continue;
          const c2 = `${kr}${s2}`;
          if (!exclude.has(c2) && kr !== "Q") out.push([q, c2]);
        }
      }
    }
  }

  if (family === "j8s_j10o") {
    const kickersSuited = ["8", "9", "T", "Q", "K", "A"];
    const kickersOffsuit = ["T", "Q", "K", "A"];
    for (const suit of SUITS) {
      const j = `J${suit}`;
      if (exclude.has(j)) continue;
      for (const kr of kickersSuited) {
        const c2 = `${kr}${suit}`;
        if (kr !== "J" && !exclude.has(c2)) out.push([j, c2]);
      }
      for (const kr of kickersOffsuit) {
        for (const s2 of SUITS) {
          if (s2 === suit) continue;
          const c2 = `${kr}${s2}`;
          if (!exclude.has(c2) && kr !== "J") out.push([j, c2]);
        }
      }
    }
  }

  if (family === "connectors") {
    for (let r = 0; r < RANKS.length - 1; r++) {
      const rank1 = RANKS[r];
      const rank2 = RANKS[r + 1];
      for (const s1 of SUITS) {
        for (const s2 of SUITS) {
          const c1 = `${rank1}${s1}`;
          const c2 = `${rank2}${s2}`;
          if (!exclude.has(c1) && !exclude.has(c2)) out.push([c1, c2]);
        }
      }
    }
  }

  if (family === "suited_one_gappers") {
    for (let r = 0; r < RANKS.length - 2; r++) {
      const rank1 = RANKS[r];
      const rank2 = RANKS[r + 2];
      for (const suit of SUITS) {
        const c1 = `${rank1}${suit}`;
        const c2 = `${rank2}${suit}`;
        if (!exclude.has(c1) && !exclude.has(c2)) out.push([c1, c2]);
      }
    }
  }

  if (family === "pocket_pairs") {
    for (const rank of RANKS) {
      const cands = SUITS.flatMap((s1) =>
        SUITS.filter((s2) => s1 !== s2).map((s2) => [`${rank}${s1}`, `${rank}${s2}`] as [string, string])
      );
      for (const [c1, c2] of cands) {
        if (!exclude.has(c1) && !exclude.has(c2)) out.push([c1, c2]);
      }
    }
  }

  if (family === "random") {
    const deck = RANKS.flatMap((r) => SUITS.map((s) => `${r}${s}`));
    for (const c1 of deck) {
      if (exclude.has(c1)) continue;
      for (const c2 of deck) {
        if (c1 >= c2) continue;
        if (!exclude.has(c2)) out.push([c1, c2]);
      }
    }
  }

  return out;
}

/** Sample a family based on weights. Exclude "random" if you want only named families. */
function sampleFamily(weights: Record<HandFamily, number>): HandFamily {
  const entries = Object.entries(weights) as [HandFamily, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [fam, w] of entries) {
    r -= w;
    if (r <= 0) return fam;
  }
  return entries[entries.length - 1][0];
}

/**
 * Generate 4 hands with no overlapping cards.
 * Uses weighted family sampling. Each hand is picked from a (possibly repeated) family.
 */
export function generateFourHandsWithFamilies(
  weights: Record<HandFamily, number> = DEFAULT_HAND_FAMILY_WEIGHTS,
  maxAttempts = 100
): [string, string][] | null {
  const used = new Set<string>();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const hands: [string, string][] = [];
    used.clear();

    for (let i = 0; i < 4; i++) {
      const family = sampleFamily(weights);
      const hand = pickHandFromFamily(family, used);
      if (!hand) break;
      hands.push(hand);
      used.add(hand[0]);
      used.add(hand[1]);
    }

    if (hands.length === 4) return hands;
  }

  return null;
}
