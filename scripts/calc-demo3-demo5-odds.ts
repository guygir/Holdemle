/**
 * Calculate odds for demo3 and demo5 puzzles
 * Run: npx tsx scripts/calc-demo3-demo5-odds.ts
 */

import { calculatePreFlopOddsExhaustive, roundToSum100 } from "../lib/poker/odds-calculator";

// Demo3 puzzle - 3 hands
const demo3Hands: [string, string][] = [
  ["As", "Ah"], // Pocket Aces
  ["Kd", "Kc"], // Pocket Kings  
  ["Qh", "Js"], // QJ suited
];

// Demo5 puzzle - 5 hands
const demo5Hands: [string, string][] = [
  ["As", "Kh"], // AK offsuit
  ["Qd", "Qc"], // Pocket Queens
  ["Jh", "Js"], // Pocket Jacks
  ["Tc", "9c"], // T9 suited
  ["7d", "7h"], // Pocket 7s
];

console.log("Calculating Demo3 odds (3 hands)...");
const demo3Odds = calculatePreFlopOddsExhaustive(demo3Hands);
const demo3Rounded = roundToSum100(demo3Odds);

console.log("\nDemo3 Results:");
demo3Hands.forEach((hand, i) => {
  console.log(`  Hand ${i + 1}: ${hand.join("")} = ${demo3Rounded[i]}%`);
});
console.log(`  Sum: ${demo3Rounded.reduce((a, b) => a + b, 0)}%`);

console.log("\n" + "=".repeat(50));
console.log("\nCalculating Demo5 odds (5 hands)...");
const demo5Odds = calculatePreFlopOddsExhaustive(demo5Hands);
const demo5Rounded = roundToSum100(demo5Odds);

console.log("\nDemo5 Results:");
demo5Hands.forEach((hand, i) => {
  console.log(`  Hand ${i + 1}: ${hand.join("")} = ${demo5Rounded[i]}%`);
});
console.log(`  Sum: ${demo5Rounded.reduce((a, b) => a + b, 0)}%`);

console.log("\n" + "=".repeat(50));
console.log("\nCopy these values into app/api/puzzle/daily/route.ts:");
console.log("\nconst DEMO3_PUZZLE = {");
console.log('  id: "demo3-puzzle",');
console.log('  puzzle_date: new Date().toISOString().split("T")[0],');
console.log("  hands: [");
demo3Hands.forEach((hand, i) => {
  console.log(`    { position: ${i + 1}, cards: ["${hand[0]}", "${hand[1]}"], actualPercent: ${demo3Rounded[i]} },`);
});
console.log("  ],");
console.log('  difficulty: "easy",');
console.log("};");

console.log("\nconst DEMO5_PUZZLE = {");
console.log('  id: "demo5-puzzle",');
console.log('  puzzle_date: new Date().toISOString().split("T")[0],');
console.log("  hands: [");
demo5Hands.forEach((hand, i) => {
  console.log(`    { position: ${i + 1}, cards: ["${hand[0]}", "${hand[1]}"], actualPercent: ${demo5Rounded[i]} },`);
});
console.log("  ],");
console.log('  difficulty: "hard",');
console.log("};");

// Made with Bob
