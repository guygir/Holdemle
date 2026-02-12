import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const user = (await supabase.auth.getUser()).data.user;

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  let body: { puzzleId: string; elapsedSeconds: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { puzzleId, elapsedSeconds } = body;
  if (!puzzleId || typeof elapsedSeconds !== "number" || elapsedSeconds < 0) {
    return NextResponse.json(
      { success: false, error: "Missing puzzleId or invalid elapsedSeconds" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("guesses")
    .update({ paused_elapsed_seconds: Math.floor(elapsedSeconds) })
    .eq("puzzle_id", puzzleId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { success: false, error: "Failed to save pause state" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
