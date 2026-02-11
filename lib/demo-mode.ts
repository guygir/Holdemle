/**
 * Demo mode logic and production checks.
 * In production (Vercel), we require Supabase and fail fast if missing.
 */

function isProduction(): boolean {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder"));
}

/**
 * Returns whether to use demo mode.
 * In production: never use demo if Supabase is missing — callers should handle "fail" case.
 */
export function getUseDemo(): boolean | "fail" {
  const prod = isProduction();
  const supabaseOk = isSupabaseConfigured();
  const explicitDemo = process.env.NEXT_PUBLIC_USE_DEMO_PUZZLE === "true";

  if (prod && !supabaseOk) {
    return "fail";
  }
  return explicitDemo || !supabaseOk;
}
