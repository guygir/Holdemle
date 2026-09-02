/**
 * List first-guess (1/1) solves.
 * Run: npx tsx scripts/list-first-guess-solves.ts
 * Requires: .env.local with Supabase credentials
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createAdminClient } from "../lib/supabase/admin";
import { fetchHonorableMentions, monthAgoDateUtc } from "../lib/honorable-mentions";

async function main() {
  const supabase = createAdminClient();
  const result = await fetchHonorableMentions(supabase, { limit: 20 });
  const since = monthAgoDateUtc();

  console.log(`\nFirst-guess solves in the last 30 days (since ${since}):`);
  console.log(`  Unique users: ${result.lastMonthUserCount}`);
  console.log(`  Total 1/1 solves: ${result.lastMonthSolveCount}\n`);

  console.log(`Last ${result.mentions.length} first-guess solve(s):\n`);
  for (const m of result.mentions) {
    const hands = m.hands
      .map((h) => `${h.cards.join("")} ${h.percent}%`)
      .join(" | ");
    const flop = m.flop ? ` flop ${m.flop.join(" ")}` : "";
    console.log(`  ${m.date}  ${m.nickname}${flop}`);
    console.log(`    ${hands}`);
    console.log(`    submitted ${m.submittedAt}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
