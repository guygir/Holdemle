/**
 * Quick verification of user_stats after cleanup.
 * Run: npx tsx scripts/verify-stats.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const supabase = createAdminClient();
  const { data: stats } = await supabase.from("user_stats").select("*");
  const { data: profiles } = await supabase.from("profiles").select("user_id, nickname");
  const nick = (p: { user_id: string }) => profiles?.find((x) => x.user_id === p.user_id)?.nickname ?? p.user_id.slice(0, 8);
  console.log("\nUser Stats (personal stats page source):\n");
  for (const s of stats ?? []) {
    const n = nick(s);
    console.log(n + ":");
    console.log("  Total games:", s.total_games);
    console.log("  Solved dist:", JSON.stringify(s.solved_distribution));
    console.log("  Failed:", s.failed_games);
    console.log("  Streak:", s.current_streak, "| Max:", s.max_streak);
    console.log("  Avg guesses:", s.average_guesses);
    console.log("  Last played:", s.last_played_date);
    console.log("");
  }
}

main();
