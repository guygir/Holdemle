/**
 * Monte Carlo equity comparison only.
 * Run: npx tsx scripts/compare-equity-methods.ts
 *
 * Override hands: HANDS='[["3h","4c"],["Jd","Qd"],["Ad","Qc"],["Jc","Ah"]]' npx tsx scripts/compare-equity-methods.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { Hand } from "pokersolver";
import { createDeck, shuffleDeck } from "../lib/poker/deck";

type Hand4 = [string, string][];

const MC_ITERATIONS = [200_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000];

function monteCarlo(hands: Hand4, iterations: number): number[] {
  const equity = new Array(hands.length).fill(0);
  for (let i = 0; i < iterations; i++) {
    const usedCards = hands.flat();
    const deck = shuffleDeck(createDeck(usedCards));
    const board = deck.slice(0, 5);

    const handResults = hands.map((holeCards) =>
      Hand.solve([...holeCards, ...board])
    );
    const winners = Hand.winners(handResults);
    const winShare = 1 / winners.length;
    winners.forEach((winner) => {
      const idx = handResults.indexOf(winner);
      equity[idx] += winShare;
    });
  }
  return hands.map((_, i) => (equity[i] / iterations) * 100);
}

async function getTodayPuzzleHands(): Promise<Hand4 | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key);
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("puzzles")
    .select("hands")
    .eq("puzzle_date", today)
    .single();
  if (!data?.hands || !Array.isArray(data.hands) || data.hands.length !== 4) return null;
  return data.hands.map((h: { cards: string[] }) => [h.cards[0], h.cards[1]] as [string, string]);
}

function getHandsFromEnv(): Hand4 | null {
  const raw = process.env.HANDS;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as string[][];
    if (parsed.length !== 4 || parsed.some((h) => !Array.isArray(h) || h.length !== 2)) return null;
    return parsed as Hand4;
  } catch {
    return null;
  }
}

async function main() {
  console.log("[1/3] Resolving hands...\n");

  let hands: Hand4 = getHandsFromEnv() ?? (await getTodayPuzzleHands()) ?? [
    ["As", "Kh"],
    ["Qd", "Qc"],
    ["Jh", "Js"],
    ["9c", "9d"],
  ];

  const handLabels = hands.map((h) => `${h[0]}${h[1]}`);
  console.log("Hands:", handLabels.join(", "));
  console.log("");

  console.log("[2/3] Running Monte Carlo simulations...\n");

  const results: { label: string; pcts: number[] }[] = [];

  for (const n of MC_ITERATIONS) {
    const label = `Monte Carlo ${n >= 1_000_000 ? `${n / 1_000_000}M` : `${n / 1_000}k`}`;
    process.stdout.write(`  Running ${label}...`);
    const start = Date.now();
    const pcts = monteCarlo(hands, n);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    results.push({ label, pcts });
    console.log(` done (${elapsed}s)`);
  }

  console.log("\n[3/3] Results:\n");

  const sep = "-".repeat(70);
  console.log(sep);
  console.log("METHOD".padEnd(22), "| H1     | H2     | H3     | H4     | SUM");
  console.log(sep);

  for (const { label, pcts } of results) {
    const sum = pcts.reduce((a, b) => a + b, 0);
    const s = pcts.map((p) => p.toFixed(2).padStart(7)).join(" | ");
    console.log(label.padEnd(22), "|", s, "|", sum.toFixed(2));
  }

  console.log(sep);
  console.log("\nHand labels:", handLabels.map((l, i) => `${l}=H${i + 1}`).join(", "));
}

main().catch(console.error);
