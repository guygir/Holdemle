import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_LENGTH = 100;
const MAX_PER_24H = 3;
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const RATE_COOKIE = "suggestion_rate";

/** Sanitize: allow letters, digits, spaces, basic punctuation. Block injection patterns. */
function sanitize(text: string): string {
  const trimmed = text.trim();
  // Remove/escape dangerous chars: < > \ ` [ ] ( ) that could enable markdown/code injection
  let out = trimmed
    .replace(/[<>\\`]/g, "")
    .replace(/\[/g, "(")
    .replace(/\]/g, ")")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/vbscript:/gi, "");
  return out.slice(0, MAX_LENGTH);
}

function parseRateCookie(cookieHeader: string | null): number[] {
  if (!cookieHeader) return [];
  const match = cookieHeader.match(new RegExp(`${RATE_COOKIE}=([^;]+)`));
  if (!match) return [];
  try {
    const decoded = decodeURIComponent(match[1]);
    const arr = JSON.parse(decoded) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => typeof x === "number");
  } catch {
    return [];
  }
}

function getRateLimitResponse(): NextResponse {
  const res = NextResponse.json(
    { success: false, error: "Rate limit: please try again tomorrow." },
    { status: 429 }
  );
  return res;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Please log in to submit a suggestion." },
      { status: 401 }
    );
  }

  const token = process.env.GITHUB_SUGGESTIONS_TOKEN;
  if (!token) {
    console.error("GITHUB_SUGGESTIONS_TOKEN not configured");
    return NextResponse.json(
      { success: false, error: "Suggestion service not configured." },
      { status: 503 }
    );
  }

  // Rate limit (cookie-based)
  const cookieHeader = request.headers.get("cookie");
  const timestamps = parseRateCookie(cookieHeader);
  const now = Date.now();
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= MAX_PER_24H) {
    return getRateLimitResponse();
  }

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  const raw = typeof body?.text === "string" ? body.text : "";
  const sanitized = sanitize(raw);
  if (sanitized.length === 0) {
    return NextResponse.json(
      { success: false, error: "Please enter a suggestion (max 100 characters)." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("nickname")
    .eq("user_id", user.id)
    .maybeSingle();
  const nickname = profile?.nickname ?? user.user_metadata?.nickname ?? "Anonymous";
  const email = user.email ?? "no-email";

  const title = `Suggestion from ${nickname}`.slice(0, 256);
  const bodyText = `${sanitized}

---
Submitted by: ${email}
User ID: ${user.id}
Date: ${new Date().toISOString()}`;

  try {
    const res = await fetch("https://api.github.com/repos/guygir/Holdemle/issues", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body: bodyText }),
    });

    const data = await res.json();

    if (!res.ok) {
      const ghMessage = typeof data?.message === "string" ? data.message : "";
      console.error("GitHub API error:", res.status, data);
      const isDev = process.env.NODE_ENV === "development";
      return NextResponse.json(
        {
          success: false,
          error: isDev && ghMessage
            ? `GitHub API: ${ghMessage}`
            : "Failed to create issue. Please try again later.",
        },
        { status: 502 }
      );
    }

    const issueUrl = data.html_url ?? "";

    // Update rate limit cookie
    const newTimestamps = [...recent, now].slice(-MAX_PER_24H);
    const res2 = NextResponse.json({
      success: true,
      issueUrl,
    });
    res2.cookies.set(RATE_COOKIE, JSON.stringify(newTimestamps), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: RATE_WINDOW_MS / 1000,
      path: "/",
    });
    return res2;
  } catch (err) {
    console.error("Suggestion error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to submit. Please try again later." },
      { status: 500 }
    );
  }
}
