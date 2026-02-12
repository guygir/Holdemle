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
    <main className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6">
      <div className="max-w-md lg:max-w-xl xl:max-w-2xl w-full text-center space-y-4 sm:space-y-8">
        <div className="space-y-0.5 sm:space-y-1 text-center">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#1a1a1b]">
            🃏 Hold&apos;emle 🃏
          </h1>
          <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-[#1a1a1b] font-medium">
            Texas Hold&apos;em Daily Puzzle
          </p>
          <p className="text-sm sm:text-lg lg:text-xl xl:text-2xl text-gray-600">
            Hello, {nickname || "anonymous"}
          </p>
        </div>

        <div className="space-y-2 sm:space-y-4">
          {nickname ? (
            <>
              <Link
                href="/game"
                className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[56px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-2xl px-4 sm:px-6 bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                Play Today&apos;s Puzzle
              </Link>
              <Link
                href="/stats"
                className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[56px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-2xl px-4 sm:px-6 bg-[#85c0f9] text-white font-semibold rounded-lg hover:bg-[#75b0e9] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                Stats
              </Link>
              <Link
                href="/leaderboard"
                className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[56px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-2xl px-4 sm:px-6 bg-[#D4AF37] text-[#1a1a1b] font-semibold rounded-lg border border-[#B8962E] hover:bg-[#C9A227] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                View Leaderboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[56px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-2xl px-4 sm:px-6 bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                Sign in / Sign up
              </Link>
              <Link
                href="/game?demo=1"
                className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[56px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-2xl px-4 sm:px-6 bg-[#85c0f9] text-white font-semibold rounded-lg hover:bg-[#75b0e9] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                Try Demo
              </Link>
              <Link
                href="/leaderboard"
                className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[56px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-2xl px-4 sm:px-6 bg-[#D4AF37] text-[#1a1a1b] font-semibold rounded-lg border border-[#B8962E] hover:bg-[#C9A227] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                View Leaderboard
              </Link>
            </>
          )}
          <Link
            href="/how-to-play"
            className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[52px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-xl px-4 sm:px-6 bg-[#f6f7f8] text-[#1a1a1b] font-semibold rounded-lg border border-[#d3d6da] hover:bg-[#e8e9eb] transition-colors [touch-action:manipulation] flex items-center justify-center"
          >
            How to Play
          </Link>
        </div>

        <div className="pt-4 sm:pt-8 border-t border-[#d3d6da] space-y-4">
          <a
            href={process.env.NEXT_PUBLIC_GITHUB_REPO || "https://github.com/guygir/Holdemle"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-col items-center gap-1 text-gray-600 hover:text-[#1a1a1b] transition-colors"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <span className="text-xs sm:text-sm">Open to contributions</span>
          </a>
          <div>
            <p className="text-xs sm:text-base lg:text-lg text-gray-500">📊 Latest Updates</p>
            <p className="text-xs sm:text-base lg:text-lg text-gray-600 mt-0.5 sm:mt-1">v1.0 - We&apos;re live!</p>
          </div>
        </div>
      </div>
    </main>
  );
}
