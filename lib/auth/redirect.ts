const ALLOWED_REDIRECT_PATHS = new Set(["/", "/game", "/leaderboard", "/stats", "/how-to-play"]);

/**
 * Validate redirect param against whitelist to prevent open redirect.
 * Returns a safe path (default /game) for use with router.push.
 */
export function getSafeRedirect(redirect: string | null): string {
  if (!redirect || typeof redirect !== "string") return "/game";
  const trimmed = redirect.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/game";
  const pathname = trimmed.split("?")[0].split("#")[0];
  return ALLOWED_REDIRECT_PATHS.has(pathname) ? pathname : "/game";
}
