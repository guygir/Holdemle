/**
 * Recalculate demo puzzle percentages using pokersolver Monte Carlo (1M iterations).
 * This matches the method used by generate-puzzles and the game.
 * Run: npx tsx scripts/calc-demo-odds-new.ts
 */
import { calculatePreFlopOdds, roundToSum100 } from "../lib/poker/odds-calculator";

const hands: [string, string][] = [
  ["As", "Kh"],
  ["Qd", "Qc"],
  ["Jh", "Js"],
  ["9c", "9d"],
];

async function main() {
  console.log("Calculating odds for demo hands (1M Monte Carlo, pokersolver)...\n");
  const raw = await calculatePreFlopOdds(hands, 1_000_000);
  console.log("Raw:", raw.map((o) => o.toFixed(2)).join(", "));
  const rounded = roundToSum100(raw);
  console.log("Rounded:", rounded.join(", "));
  console.log("\nUpdate DEMO_PUZZLE in app/api/puzzle/daily/route.ts:");
  console.log(
    hands
      .map(
        (h, i) =>
          `  { position: ${i + 1}, cards: [${h.map((c) => `"${c}"`).join(", ")}], actualPercent: ${rounded[i]} },`
      )
      .join("\n")
  );
}

main().catch(console.error);
