/**
 * Pre-generate puzzles for Poker Wordle.
 * Run: npm run generate-puzzles (loads .env.local)
 *      or: npx tsx scripts/generate-puzzles.ts (with env vars set)
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional env:
 *   HAND_FAMILY_WEIGHTS - JSON object, e.g. '{"pocket_pairs":20,"connectors":15}'
 *     Families: all_ax, k4s_k6o, q6s_q8o, j8s_j10o, connectors, suited_one_gappers, pocket_pairs, random
 *   PUZZLE_DAYS - number of days to generate (default 30)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { calculatePreFlopOdds, roundToSum100 } from "../lib/poker/odds-calculator";
import {
  generateFourHandsWithFamilies,
  DEFAULT_HAND_FAMILY_WEIGHTS,
  type HandFamily,
} from "../lib/poker/hand-families";

function parseWeights(): Record<HandFamily, number> {
  const raw = process.env.HAND_FAMILY_WEIGHTS;
  if (!raw) return DEFAULT_HAND_FAMILY_WEIGHTS;
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return { ...DEFAULT_HAND_FAMILY_WEIGHTS, ...parsed };
  } catch {
    return DEFAULT_HAND_FAMILY_WEIGHTS;
  }
}

function generateFourHands(): [string, string][] {
  const weights = parseWeights();
  const hands = generateFourHandsWithFamilies(weights);
  if (!hands) {
    throw new Error("Failed to generate 4 non-overlapping hands");
  }
  return hands;
}

function calculateDifficulty(odds: number[]): "easy" | "medium" | "hard" {
  const max = Math.max(...odds);
  const min = Math.min(...odds);
  const spread = max - min;
  if (spread >= 15) return "easy";
  if (spread >= 8) return "medium";
  return "hard";
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const days = parseInt(process.env.PUZZLE_DAYS || "30", 10);
  const weights = parseWeights();
  console.log("Hand family weights:", JSON.stringify(weights, null, 2), "\n");

  const startDate = new Date();

  for (let i = 0; i < days; i++) {
    const puzzleDate = new Date(startDate);
    puzzleDate.setDate(startDate.getDate() + i);
    const dateStr = puzzleDate.toISOString().split("T")[0];

    const { data: existing } = await supabase
      .from("puzzles")
      .select("id")
      .eq("puzzle_date", dateStr)
      .single();

    if (existing) {
      console.log(`Skip ${dateStr} (exists)`);
      continue;
    }

    let hands: [string, string][];
    let odds: number[];
    let attempts = 0;

    do {
      hands = generateFourHands();
      odds = await calculatePreFlopOdds(hands); // Uses poker-odds-calc exhaustive (exact) for 4 hands
      attempts++;
      if (attempts > 50) {
        console.error("Could not generate valid puzzle for", dateStr);
        break;
      }
    } while (odds.some((o) => o < 5 || o > 50));

    const rounded = roundToSum100(odds);
    const difficulty = calculateDifficulty(rounded);

    const puzzleHands = hands.map((cards, idx) => ({
      position: idx + 1,
      cards,
      actualPercent: rounded[idx],
    }));

    const { error } = await supabase.from("puzzles").insert({
      puzzle_date: dateStr,
      hands: puzzleHands,
      difficulty,
    });

    if (error) {
      console.error(`Error for ${dateStr}:`, error);
    } else {
      console.log(`✓ ${dateStr} - ${difficulty} - ${rounded.join("/")}%`);
    }
  }

  console.log(`\nDone! Generated up to ${days} days of puzzles.`);
}

main();
