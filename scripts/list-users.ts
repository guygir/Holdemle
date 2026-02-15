/**
 * List all users (profiles) in the database.
 * Run: npx tsx scripts/list-users.ts
 * Requires: .env.local with Supabase credentials
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const supabase = createAdminClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("user_id, nickname, email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  console.log(`\nTotal users: ${profiles?.length ?? 0}\n`);
  console.table(profiles ?? []);
}

main();
