import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  let nickname = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("user_id", user.id)
      .maybeSingle();
    nickname = profile?.nickname ?? user.user_metadata?.nickname ?? user.email?.split("@")[0] ?? "";
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md lg:max-w-xl xl:max-w-2xl w-full text-center space-y-8">
        <div className="space-y-1">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#1a1a1b]">
            🃏 Poker Wordle
          </h1>
          <p className="text-lg lg:text-xl xl:text-2xl text-gray-600">
            Hello, {nickname || "anonymous"}
          </p>
        </div>

        <div className="space-y-4">
          {nickname ? (
            <>
              <Link
                href="/game"
                className="block w-full min-h-[44px] lg:min-h-[56px] lg:py-4 lg:text-2xl py-3 px-6 bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                Play Today&apos;s Puzzle
              </Link>
              <Link
                href="/leaderboard"
                className="block w-full min-h-[44px] lg:min-h-[56px] lg:py-4 lg:text-2xl py-3 px-6 bg-[#f6f7f8] text-[#1a1a1b] font-semibold rounded-lg border border-[#d3d6da] hover:bg-[#e8e9eb] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                View Leaderboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="block w-full min-h-[44px] lg:min-h-[56px] lg:py-4 lg:text-2xl py-3 px-6 bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                Sign in / Sign up
              </Link>
              <Link
                href="/game?demo=1"
                className="block w-full min-h-[44px] lg:min-h-[56px] lg:py-4 lg:text-2xl py-3 px-6 bg-[#85c0f9] text-white font-semibold rounded-lg hover:bg-[#75b0e9] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                Try Demo
              </Link>
              <Link
                href="/leaderboard"
                className="block w-full min-h-[44px] lg:min-h-[56px] lg:py-4 lg:text-2xl py-3 px-6 bg-[#f6f7f8] text-[#1a1a1b] font-semibold rounded-lg border border-[#d3d6da] hover:bg-[#e8e9eb] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                View Leaderboard
              </Link>
            </>
          )}
          <Link
            href="/how-to-play"
            className="block w-full min-h-[44px] lg:min-h-[52px] lg:py-4 py-3 text-base lg:text-xl text-gray-500 hover:text-[#1a1a1b] transition-colors [touch-action:manipulation] flex items-center justify-center"
          >
            How to Play
          </Link>
        </div>

        <div className="pt-8 border-t border-[#d3d6da]">
          <p className="text-base lg:text-lg text-gray-500">📊 Latest Updates</p>
          <p className="text-base lg:text-lg text-gray-600 mt-1">v1.0 - We&apos;re live!</p>
        </div>
      </div>
    </main>
  );
}
