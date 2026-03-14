/**
 * Pre-generate puzzles for Poker Wordle.
 * Run: npm run generate-puzzles -- [days]   (e.g. npm run generate-puzzles -- 1)
 *      or: npx tsx scripts/generate-puzzles.ts [days]
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional env:
 *   PUZZLE_TYPE_DISTRIBUTION - JSON, e.g. '{"3":25,"4":35,"5":15,"4flop":25}' (must sum to 100)
 *   HAND_FAMILY_WEIGHTS - JSON object, e.g. '{"pocket_pairs":20,"connectors":15}'
 *     Families: all_ax, k4s_k6o, q6s_q8o, j8s_j10o, connectors, suited_one_gappers, pocket_pairs, random
 *   PUZZLE_DAYS - number of days to generate (default 30, overridden by arg)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import {
  calculatePreFlopOddsExhaustive,
  calculatePostFlopOddsExhaustive,
  roundToSum100,
} from "../lib/poker/odds-calculator";
import {
  generateNHandsWithFamilies,
  DEFAULT_HAND_FAMILY_WEIGHTS,
  type HandFamily,
} from "../lib/poker/hand-families";
import { createDeck, shuffleDeck } from "../lib/poker/deck";
import { samplePuzzleType } from "../lib/puzzle-generation";

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

function generateFlop(usedCards: string[]): [string, string, string] {
  const deck = shuffleDeck(createDeck(usedCards));
  return [deck[0], deck[1], deck[2]];
}

function generateHands(): { hands: [string, string][]; flop?: [string, string, string] } {
  const weights = parseWeights();
  const type = samplePuzzleType();
  const n = type === "4flop" ? 4 : parseInt(type, 10);
  const hands = generateNHandsWithFamilies(n, weights);
  if (!hands) {
    throw new Error(`Failed to generate ${n} non-overlapping hands`);
  }
  if (type === "4flop") {
    const flop = generateFlop(hands.flat());
    return { hands, flop };
  }
  return { hands };
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
  const daysArg = process.argv[2] ?? process.env.PUZZLE_DAYS ?? "30";
  const days = parseInt(daysArg, 10);
  const weights = parseWeights();
  console.log("Hand family weights:", JSON.stringify(weights, null, 2), "\n");

  const startDate = new Date();

  for (let i = 0; i < days; i++) {
    const puzzleDate = new Date(startDate);
    puzzleDate.setDate(startDate.getDate() + i);
    const dateStr = puzzleDate.toISOString().split("T")[0];

    let gen = generateHands();
    let hands = gen.hands;
    let flop = gen.flop;
    const typeLabel = flop ? "4-hand post-flop" : `${hands.length}-hand`;
    console.log(`${dateStr} - ${typeLabel}:`, hands.map(([a, b]) => `${a}${b}`).join(" "), flop ? `flop: ${flop.join(" ")}` : "");

    const { data: existing } = await supabase
      .from("puzzles")
      .select("id")
      .eq("puzzle_date", dateStr)
      .single();

    if (existing) {
      console.log(`  Skip (exists)\n`);
      continue;
    }

    let odds: number[];
    let attempts = 0;

    do {
      if (attempts > 0) {
        gen = generateHands();
        hands = gen.hands;
        flop = gen.flop;
        console.log(`${dateStr} - ${flop ? "4-hand post-flop" : hands.length + "-hand"} (retry):`, hands.map(([a, b]) => `${a}${b}`).join(" "), flop ? `flop: ${flop.join(" ")}` : "");
      }
      odds = flop
        ? calculatePostFlopOddsExhaustive(hands, flop)
        : calculatePreFlopOddsExhaustive(hands);
      attempts++;
      if (attempts > 50) {
        console.error("Could not generate valid puzzle for", dateStr);
        continue;
      }
    } while (odds.some((o) => o < 5 || o > 50));

    const rounded = roundToSum100(odds);
    const difficulty = calculateDifficulty(rounded);

    const puzzleHands = hands.map((cards, idx) => ({
      position: idx + 1,
      cards,
      actualPercent: rounded[idx],
    }));

    const insertPayload: Record<string, unknown> = {
      puzzle_date: dateStr,
      hands: puzzleHands,
      difficulty,
    };
    if (flop) insertPayload.flop = flop;

    const { error } = await supabase.from("puzzles").insert(insertPayload);

    if (error) {
      console.error(`Error for ${dateStr}:`, error);
    } else {
      console.log(`✓ ${dateStr} - ${difficulty} - ${rounded.join("/")}%`);
    }
  }

  console.log(`\nDone! Generated up to ${days} days of puzzles.`);
}

main();
