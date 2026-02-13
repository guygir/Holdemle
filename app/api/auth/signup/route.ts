/**
 * Sign up with nickname + password.
 * Generates a synthetic email internally; user never sees it.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 32) || "user";
}

function generateShortId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, password } = body as { nickname?: string; password?: string };

    if (!nickname || typeof nickname !== "string") {
      return NextResponse.json(
        { error: "Nickname is required" },
        { status: 400 }
      );
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      return NextResponse.json(
        { error: "Nickname must be 2-30 characters" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const slug = slugify(trimmed);
    const domain = process.env.AUTH_EMAIL_DOMAIN || "holdemle.invalid";
    const authEmail = `${slug}_${generateShortId()}@${domain}`;

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password,
      options: {
        data: { nickname: trimmed },
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      if (error.message?.includes("already registered") || error.code === "user_already_exists") {
        return NextResponse.json(
          { error: "An account with this nickname may already exist. Try logging in." },
          { status: 400 }
        );
      }
      if (error.message?.toLowerCase().includes("nickname") || error.message?.toLowerCase().includes("unique")) {
        return NextResponse.json(
          { error: "Nickname is already taken" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message || "Sign up failed" },
        { status: 400 }
      );
    }

    if (data.session) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({
      success: true,
      message: "Account created. Please check your email to confirm.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
