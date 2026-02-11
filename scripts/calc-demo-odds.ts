import { calculatePreFlopOdds, roundToSum100 } from "../lib/poker/odds-calculator";

async function main() {
  const hands: [string, string][] = [
    ["As", "Kh"],
    ["Qd", "Qc"],
    ["Jh", "Js"],
    ["9c", "9d"],
  ];
  console.log("Calculating odds for AK, QQ, JJ, 99...\n");
  console.log("(Use 50k iterations for high accuracy; 10k is faster)\n");
  const iterations = parseInt(process.env.ITERATIONS || "10000", 10);
  const odds = await calculatePreFlopOdds(hands, iterations);
  console.log("Raw odds:", odds.map((o) => o.toFixed(2)).join(", "));
  const rounded = roundToSum100(odds);
  console.log("Rounded to sum 100:", rounded.join(", "));
}
main();
