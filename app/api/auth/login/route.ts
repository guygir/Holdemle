/**
 * Login with nickname + password.
 * Looks up auth email by nickname (server-side only), then signs in.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const admin = createAdminClient();
    const { data: emailResult, error: rpcError } = await admin.rpc("get_auth_email_for_nickname", {
      p_nickname: nickname.trim(),
    });

    if (rpcError) {
      console.error("Login lookup error:", rpcError);
      return NextResponse.json(
        { error: "Invalid nickname or password" },
        { status: 401 }
      );
    }

    const authEmail = typeof emailResult === "string" ? emailResult : null;
    if (!authEmail) {
      return NextResponse.json(
        { error: "Invalid nickname or password" },
        { status: 401 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: "Invalid nickname or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
