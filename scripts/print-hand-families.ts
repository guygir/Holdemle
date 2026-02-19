/**
 * Print all hand families with weights and hands.
 * Run: npx tsx scripts/print-hand-families.ts
 */

import {
  DEFAULT_HAND_FAMILY_WEIGHTS,
  type HandFamily,
} from "../lib/poker/hand-families";

// Replicate the build logic to get hands per family
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const SUITS = ["s", "h", "d", "c"] as const;
const RANK_INDEX: Record<string, number> = Object.fromEntries(
  RANKS.map((r, i) => [r, i])
);

function canonical(c1: string, c2: string): [string, string] {
  const r1 = RANK_INDEX[c1[0]] ?? -1;
  const r2 = RANK_INDEX[c2[0]] ?? -1;
  if (r1 > r2) return [c1, c2];
  if (r1 < r2) return [c2, c1];
  const s1 = SUITS.indexOf(c1[1] as (typeof SUITS)[number]);
  const s2 = SUITS.indexOf(c2[1] as (typeof SUITS)[number]);
  return s1 >= s2 ? [c1, c2] : [c2, c1];
}

function handKey(hand: [string, string]): string {
  const [a, b] = canonical(hand[0], hand[1]);
  return `${a}${b}`;
}

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

  for (let r = 0; r < RANKS.length - 1; r++) {
    const rank1 = RANKS[r];
    const rank2 = RANKS[r + 1];
    for (const s1 of SUITS) {
      for (const s2 of SUITS) {
        addHand(`${rank1}${s1}`, `${rank2}${s2}`, "connectors");
      }
    }
  }

  for (let r = 0; r < RANKS.length - 2; r++) {
    const rank1 = RANKS[r];
    const rank2 = RANKS[r + 2];
    for (const suit of SUITS) {
      addHand(`${rank1}${suit}`, `${rank2}${suit}`, "suited_one_gappers");
    }
  }

  for (const rank of RANKS) {
    const cands = SUITS.flatMap((s1) =>
      SUITS.filter((s2) => s1 !== s2).map((s2) => [
        `${rank}${s1}`,
        `${rank}${s2}`,
      ] as [string, string])
    );
    for (const [c1, c2] of cands) {
      addHand(c1, c2, "pocket_pairs");
    }
  }

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

const FAMILY_ORDER: HandFamily[] = [
  "all_ax",
  "k4s_k6o",
  "q6s_q8o",
  "j8s_j10o",
  "connectors",
  "suited_one_gappers",
  "pocket_pairs",
  "random",
];

function main() {
  const map = buildHandToFamily();
  const totalWeight = Object.values(DEFAULT_HAND_FAMILY_WEIGHTS).reduce(
    (a, b) => a + b,
    0
  );

  console.log("=== Hand families with weights and hands ===\n");
  for (const fam of FAMILY_ORDER) {
    const weight = DEFAULT_HAND_FAMILY_WEIGHTS[fam];
    const pct = ((weight / totalWeight) * 100).toFixed(1);
    const hands = [...map.entries()]
      .filter(([, f]) => f === fam)
      .map(([k]) => k)
      .sort();
    console.log(`${fam}`);
    console.log(`  Weight: ${weight} (${pct}% of total)`);
    console.log(`  Count: ${hands.length} hands`);
    console.log(`  Hands (first 20, ..., last 5):`);
    if (hands.length <= 25) {
      console.log(`    ${hands.join(", ")}`);
    } else {
      console.log(`    ${hands.slice(0, 20).join(", ")} ...`);
      console.log(`    ... ${hands.slice(-5).join(", ")}`);
    }
    console.log("");
  }
}

main();
