import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load .env.local or .env
const envLocal = path.resolve(__dirname, "../.env.local");
const envFile = path.resolve(__dirname, "../.env");
if (fs.existsSync(envLocal)) {
  dotenv.config({ path: envLocal });
} else if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  console.error("Usage: NEXT_PUBLIC_SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/reset-collaborator-passwords.ts");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PASSWORD = "Innovtec2025!";

async function main() {
  console.log("Fetching collaborateur profiles...");

  const { data: profiles, error: fetchError } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name")
    .eq("role", "collaborateur");

  if (fetchError) {
    console.error("Failed to fetch profiles:", fetchError.message);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log("No collaborateur profiles found.");
    return;
  }

  console.log(`Found ${profiles.length} collaborateurs. Resetting passwords...\n`);

  let success = 0;
  let failed = 0;

  for (const profile of profiles) {
    const { error } = await supabase.auth.admin.updateUserById(profile.id, {
      password: DEFAULT_PASSWORD,
    });

    if (error) {
      console.error(`FAIL: ${profile.email} — ${error.message}`);
      failed++;
    } else {
      console.log(`OK:   ${profile.email}`);
      success++;
    }
  }

  console.log(`\nDone! ${success} OK, ${failed} failed out of ${profiles.length} total.`);
}

main();
