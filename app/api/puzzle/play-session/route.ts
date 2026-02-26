import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentPuzzleDate } from "@/lib/puzzle";

type EventType = "start" | "pause" | "resume";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const user = (await supabase.auth.getUser()).data.user;

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  let body: { puzzleId: string; event: EventType };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { puzzleId, event } = body;
  console.log("[play-session]", { event, puzzleId, userId: user.id });
  if (!puzzleId || !["start", "pause", "resume"].includes(event)) {
    return NextResponse.json(
      { success: false, error: "Missing puzzleId or invalid event" },
      { status: 400 }
    );
  }

  const currentDate = await getCurrentPuzzleDate(supabase);
  if (!currentDate) {
    return NextResponse.json(
      { success: false, error: "No puzzle available" },
      { status: 400 }
    );
  }

  const { data: puzzle, error: puzzleError } = await supabase
    .from("puzzles")
    .select("id, puzzle_date")
    .eq("id", puzzleId)
    .single();

  if (puzzleError || !puzzle) {
    return NextResponse.json(
      { success: false, error: "Puzzle not found" },
      { status: 404 }
    );
  }

  if (puzzle.puzzle_date !== currentDate) {
    return NextResponse.json(
      { success: false, error: "Can only track today's puzzle" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  if (event === "start") {
    const { data: existing } = await supabase
      .from("puzzle_play_sessions")
      .select("started_at, paused_at, total_pause_seconds")
      .eq("user_id", user.id)
      .eq("puzzle_id", puzzleId)
      .single();

    if (!existing) {
      const { error: insertError } = await supabase
        .from("puzzle_play_sessions")
        .insert({
          user_id: user.id,
          puzzle_id: puzzleId,
          started_at: now,
          paused_at: null,
          total_pause_seconds: 0,
          updated_at: now,
        });

      if (insertError) {
        console.error("Play session start error:", insertError);
        return NextResponse.json(
          { success: false, error: "Failed to start session" },
          { status: 500 }
        );
      }
    } else if (existing.paused_at) {
      const pauseDuration = Math.floor(
        (Date.now() - new Date(existing.paused_at).getTime()) / 1000
      );
      const newTotal = (existing.total_pause_seconds ?? 0) + pauseDuration;
      const { error: updateError } = await supabase
        .from("puzzle_play_sessions")
        .update({
          paused_at: null,
          total_pause_seconds: newTotal,
          updated_at: now,
        })
        .eq("user_id", user.id)
        .eq("puzzle_id", puzzleId);

      if (updateError) {
        console.error("Play session resume-on-start error:", updateError);
        return NextResponse.json(
          { success: false, error: "Failed to resume session" },
          { status: 500 }
        );
      }
    }
  } else if (event === "pause") {
    const { data: existing } = await supabase
      .from("puzzle_play_sessions")
      .select("started_at")
      .eq("user_id", user.id)
      .eq("puzzle_id", puzzleId)
      .single();

    if (existing) {
      const { error: updateError } = await supabase
        .from("puzzle_play_sessions")
        .update({ paused_at: now, updated_at: now })
        .eq("user_id", user.id)
        .eq("puzzle_id", puzzleId);

      if (updateError) {
        console.error("Play session pause error:", updateError);
        return NextResponse.json(
          { success: false, error: "Failed to pause session" },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabase
        .from("puzzle_play_sessions")
        .insert({
          user_id: user.id,
          puzzle_id: puzzleId,
          started_at: now,
          paused_at: now,
          total_pause_seconds: 0,
          updated_at: now,
        });

      if (insertError) {
        console.error("Play session pause error:", insertError);
        return NextResponse.json(
          { success: false, error: "Failed to pause session" },
          { status: 500 }
        );
      }
    }
  } else if (event === "resume") {
    const { data: session } = await supabase
      .from("puzzle_play_sessions")
      .select("paused_at, total_pause_seconds")
      .eq("user_id", user.id)
      .eq("puzzle_id", puzzleId)
      .single();

    if (!session?.paused_at) {
      return NextResponse.json({ success: true });
    }

    const pauseDuration = Math.floor(
      (Date.now() - new Date(session.paused_at).getTime()) / 1000
    );
    const newTotal = (session.total_pause_seconds ?? 0) + pauseDuration;

    const { error: updateError } = await supabase
      .from("puzzle_play_sessions")
      .update({
        paused_at: null,
        total_pause_seconds: newTotal,
        updated_at: now,
      })
      .eq("user_id", user.id)
      .eq("puzzle_id", puzzleId);

    if (updateError) {
      console.error("Play session resume error:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to resume session" },
        { status: 500 }
      );
    }
  }

  console.log("[play-session] ok", { event, puzzleId });
  return NextResponse.json({ success: true });
}
