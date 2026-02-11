/**
 * Run with: node scripts/calc-demo-odds.mjs
 * Uses poker-odds-calc EXHAUSTIVE mode = exact equity (~5 sec)
 */
import { TexasHoldem } from "poker-odds-calc";

function roundToSum100(odds) {
  const distances = odds.map((odd, i) => ({
    index: i,
    distanceToFloor: odd - Math.floor(odd),
  }));
  distances.sort((a, b) => a.distanceToFloor - b.distanceToFloor);
  const rounded = odds.map((odd, i) => {
    const shouldRoundDown = distances.slice(0, 2).some((d) => d.index === i);
    return shouldRoundDown ? Math.floor(odd) : Math.ceil(odd);
  });
  const sum = rounded.reduce((a, b) => a + b, 0);
  if (sum !== 100) {
    const diff = 100 - sum;
    rounded[rounded.indexOf(Math.max(...rounded))] += diff;
  }
  return rounded;
}

const hands = [
  ["As", "Kh"],
  ["Qd", "Qc"],
  ["Jh", "Js"],
  ["9c", "9d"],
];

console.log("Calculating EXACT odds for AK, QQ, JJ, 99 (exhaustive)...\n");

const table = new TexasHoldem();
hands.forEach((h) => table.addPlayer([h[0], h[1]]));
table.exhaustive();
const result = table.calculate();

const odds = result.getPlayers().map((p) => p.getWinsPercentage());

console.log(`Iterations: ${result.getIterations()} (all possible boards)`);
console.log(`Time: ${result.getTime()}ms\n`);
console.log("Raw odds:", odds.map((o) => o.toFixed(2)).join(", "));
const rounded = roundToSum100(odds);
console.log("Rounded:", rounded.join(", "));
