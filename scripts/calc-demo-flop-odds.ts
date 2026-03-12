/**
 * Calculate odds for demo flop puzzle (4 hands + visible flop)
 * Run: npx tsx scripts/calc-demo-flop-odds.ts
 */

import {
  calculatePostFlopOddsExhaustive,
  roundToSum100,
} from "../lib/poker/odds-calculator";

const demoFlopHands: [string, string][] = [
  ["As", "Kh"],
  ["Qd", "Qc"],
  ["Jh", "Js"],
  ["9c", "9d"],
];
const demoFlop: [string, string, string] = ["Th", "9h", "2d"];

console.log("Calculating Demo Flop odds (4 hands + flop Th 9h 2d)...");
const odds = calculatePostFlopOddsExhaustive(demoFlopHands, demoFlop);
const rounded = roundToSum100(odds);

console.log("\nDemo Flop Results:");
for (let i = 0; i < demoFlopHands.length; i++) {
  const hand = demoFlopHands[i];
  console.log("  Hand " + (i + 1) + ": " + hand.join("") + " = " + rounded[i] + "%");
}
console.log("  Sum: " + rounded.reduce((a, b) => a + b, 0) + "%");

console.log("\nCopy into app/api/puzzle/daily/route.ts DEMO_FLOP_PUZZLE:");
console.log("  flop: [\"Th\", \"9h\", \"2d\"],");
console.log("  hands: [");
for (let i = 0; i < demoFlopHands.length; i++) {
  const hand = demoFlopHands[i];
  const pct = rounded[i];
  console.log('    { position: ' + (i + 1) + ', cards: ["' + hand[0] + '", "' + hand[1] + '"], actualPercent: ' + pct + " },");
}
console.log("  ],");
