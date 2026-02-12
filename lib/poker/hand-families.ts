/**
 * Configurable hand families for puzzle generation.
 * Each hand belongs to exactly one family. No duplicates across families.
 * Order: all_ax first, then k4s_k6o (excluding taken), etc. random = all untagged.
 *
 * Card format: "As" = Ace of spades, "Kh" = King of hearts.
 * Hand format: canonical [high, low] - e.g. A5 is stored as [A?, 5?], never [5?, A?].
 */

const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const SUITS = ["s", "h", "d", "c"];
const RANK_INDEX: Record<string, number> = Object.fromEntries(RANKS.map((r, i) => [r, i]));

export type HandFamily =
  | "all_ax"
  | "k4s_k6o"
  | "q6s_q8o"
  | "j8s_j10o"
  | "connectors"
  | "suited_one_gappers"
  | "pocket_pairs"
  | "random";

/** Default weights for sampling families. */
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

const FAMILY_ORDER: HandFamily[] = [
  "all_ax",
  "k4s_k6o",
  "q6s_q8o",
  "j8s_j10o",
  "connectors",
  "suited_one_gappers",
  "pocket_pairs",
];

/** Canonical form: [higher_card, lower_card] by rank (then suit). A5 and 5A both become [A?, 5?]. */
function canonical(c1: string, c2: string): [string, string] {
  const r1 = RANK_INDEX[c1[0]] ?? -1;
  const r2 = RANK_INDEX[c2[0]] ?? -1;
  if (r1 > r2) return [c1, c2];
  if (r1 < r2) return [c2, c1];
  const s1 = SUITS.indexOf(c1[1]);
  const s2 = SUITS.indexOf(c2[1]);
  return s1 >= s2 ? [c1, c2] : [c2, c1];
}

function handKey(hand: [string, string]): string {
  const [a, b] = canonical(hand[0], hand[1]);
  return `${a}${b}`;
}

/** All possible hands in canonical form, each mapped to its family. */
function buildHandToFamily(): Map<string, HandFamily> {
  const taken = new Set<string>();
  const map = new Map<string, HandFamily>();

  function addHand(c1: string, c2: string, family: HandFamily) {
    if (c1 === c2) return;
    const [a, b] = canonical(c1, c2);
    const key = `${a}${b}`;
    if (taken.has(key)) return;
    taken.add(key);
    map.set(key, family);
  }

  // all_ax first
  for (const suit of SUITS) {
    const ace = `A${suit}`;
    for (const rank of RANKS) {
      if (rank === "A") continue;
      for (const s2 of SUITS) {
        const c2 = `${rank}${s2}`;
        addHand(ace, c2, "all_ax");
      }
    }
  }

  // k4s_k6o (K4s..K6o, excluding already taken - e.g. KA taken by all_ax)
  const kickersS = ["4", "5", "6", "7", "8", "9", "T", "J", "Q", "A"];
  const kickersO = ["6", "7", "8", "9", "T", "J", "Q", "A"];
  for (const suit of SUITS) {
    const k = `K${suit}`;
    for (const kr of kickersS) {
      const c2 = `${kr}${suit}`;
      if (kr !== "K") addHand(k, c2, "k4s_k6o");
    }
    for (const kr of kickersO) {
      for (const s2 of SUITS) {
        if (s2 === suit) continue;
        const c2 = `${kr}${s2}`;
        if (kr !== "K") addHand(k, c2, "k4s_k6o");
      }
    }
  }

  // q6s_q8o
  const qKickersS = ["6", "7", "8", "9", "T", "J", "K", "A"];
  const qKickersO = ["8", "9", "T", "J", "K", "A"];
  for (const suit of SUITS) {
    const q = `Q${suit}`;
    for (const kr of qKickersS) {
      const c2 = `${kr}${suit}`;
      if (kr !== "Q") addHand(q, c2, "q6s_q8o");
    }
    for (const kr of qKickersO) {
      for (const s2 of SUITS) {
        if (s2 === suit) continue;
        const c2 = `${kr}${s2}`;
        if (kr !== "Q") addHand(q, c2, "q6s_q8o");
      }
    }
  }

  // j8s_j10o
  const jKickersS = ["8", "9", "T", "Q", "K", "A"];
  const jKickersO = ["T", "Q", "K", "A"];
  for (const suit of SUITS) {
    const j = `J${suit}`;
    for (const kr of jKickersS) {
      const c2 = `${kr}${suit}`;
      if (kr !== "J") addHand(j, c2, "j8s_j10o");
    }
    for (const kr of jKickersO) {
      for (const s2 of SUITS) {
        if (s2 === suit) continue;
        const c2 = `${kr}${s2}`;
        if (kr !== "J") addHand(j, c2, "j8s_j10o");
      }
    }
  }

  // connectors
  for (let r = 0; r < RANKS.length - 1; r++) {
    const rank1 = RANKS[r];
    const rank2 = RANKS[r + 1];
    for (const s1 of SUITS) {
      for (const s2 of SUITS) {
        addHand(`${rank1}${s1}`, `${rank2}${s2}`, "connectors");
      }
    }
  }

  // suited_one_gappers
  for (let r = 0; r < RANKS.length - 2; r++) {
    const rank1 = RANKS[r];
    const rank2 = RANKS[r + 2];
    for (const suit of SUITS) {
      addHand(`${rank1}${suit}`, `${rank2}${suit}`, "suited_one_gappers");
    }
  }

  // pocket_pairs
  for (const rank of RANKS) {
    const cands = SUITS.flatMap((s1) =>
      SUITS.filter((s2) => s1 !== s2).map((s2) => [`${rank}${s1}`, `${rank}${s2}`] as [string, string])
    );
    for (const [c1, c2] of cands) {
      addHand(c1, c2, "pocket_pairs");
    }
  }

  // random = all hands not yet tagged
  const deck = RANKS.flatMap((r) => SUITS.map((s) => `${r}${s}`));
  for (const c1 of deck) {
    for (const c2 of deck) {
      if (c1 === c2) continue;
      const key = handKey([c1, c2]);
      if (!map.has(key)) map.set(key, "random");
    }
  }

  return map;
}

const HAND_TO_FAMILY = buildHandToFamily();

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
  for (const [key, fam] of HAND_TO_FAMILY) {
    if (fam !== family) continue;
    const c1 = key.slice(0, 2);
    const c2 = key.slice(2, 4);
    if (exclude.has(c1) || exclude.has(c2)) continue;
    out.push([c1, c2]);
  }
  return out;
}

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
 * Families have no duplicates: all_ax first, then k4s_k6o (excluding taken), etc. random = untagged.
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
