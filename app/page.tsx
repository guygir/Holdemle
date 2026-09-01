import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import versionData from "@/lib/version.json";
import DailyPlaysChart from "@/components/DailyPlaysChart";
import HonorableMentions from "@/components/HonorableMentions";
import SuggestionBox from "@/components/SuggestionBox";
import PollWidget from "@/components/PollWidget";
import { getPuzzleTypeDistribution } from "@/lib/puzzle-generation";

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
          <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#1a1a1b] dark:text-gray-100">
            🃏 Hold'emle 🃏
          </h1>
          <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-[#1a1a1b] dark:text-gray-200 font-medium">
            Texas Hold'em Daily Puzzle
          </p>
          <p className="text-sm sm:text-lg lg:text-xl xl:text-2xl text-gray-600 dark:text-gray-400">
            Hello, {nickname || "anonymous"}
          </p>
        </div>

        <div className="space-y-2 sm:space-y-4">
          {nickname ? (
            <>
              {(() => {
                const today = new Date().toISOString().split("T")[0];
                const hotfixDate = "2026-03-17"; // Show only on this date; update or remove after
                if (today !== hotfixDate) return null;
                return (
                  <div className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-950/50 dark:border-red-400 p-3 text-center">
                    <p className="text-sm sm:text-base font-semibold text-red-600 dark:text-red-400">
                      HOTFIX: Submit bug fixed, dev was fired - you can play now!
                    </p>
                  </div>
                );
              })()}
              <Link
                href="/game"
                className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[56px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-2xl px-4 sm:px-6 bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                Play Today's Puzzle
              </Link>
              <Link
                href="/stats"
                className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[56px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-2xl px-4 sm:px-6 bg-[#85c0f9] dark:bg-[#5a9fd9] text-white font-semibold rounded-lg hover:bg-[#75b0e9] dark:hover:bg-[#6aafe9] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                Stats
              </Link>
              <Link
                href="/leaderboard"
                className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[56px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-2xl px-4 sm:px-6 bg-[#D4AF37] dark:bg-[#c9a227] text-[#1a1a1b] dark:text-[#1a1a1b] font-semibold rounded-lg border border-[#B8962E] dark:border-[#a8862e] hover:bg-[#C9A227] dark:hover:bg-[#d4af37] transition-colors [touch-action:manipulation] flex items-center justify-center gap-x-1.5 flex-wrap"
              >
                <span>View Leaderboard</span>
                <span className="text-red-700 dark:text-[#b91c1c] font-bold">(UPDATED!)</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[56px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-2xl px-4 sm:px-6 bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                Sign In / Sign Up
              </Link>
              <Link
                href="/game?demo=1"
                className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[56px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-2xl px-4 sm:px-6 bg-[#85c0f9] dark:bg-[#5a9fd9] text-white font-semibold rounded-lg hover:bg-[#75b0e9] dark:hover:bg-[#6aafe9] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                Try Demo (4 hands)
              </Link>
              <Link
                href="/leaderboard"
                className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[56px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-2xl px-4 sm:px-6 bg-[#D4AF37] dark:bg-[#c9a227] text-[#1a1a1b] dark:text-[#1a1a1b] font-semibold rounded-lg border border-[#B8962E] dark:border-[#a8862e] hover:bg-[#C9A227] dark:hover:bg-[#d4af37] transition-colors [touch-action:manipulation] flex items-center justify-center gap-x-1.5 flex-wrap"
              >
                <span>View Leaderboard</span>
                <span className="text-red-700 dark:text-[#b91c1c] font-bold">(UPDATED!)</span>
              </Link>
            </>
          )}
          <SuggestionBox isLoggedIn={!!user} />
          <Link
            href="/how-to-play"
            className="block w-full min-h-[36px] sm:min-h-[44px] lg:min-h-[56px] py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-2xl px-4 sm:px-6 bg-[#f6f7f8] dark:bg-slate-800 text-[#1a1a1b] dark:text-gray-100 font-semibold rounded-lg border border-[#d3d6da] dark:border-slate-500 hover:bg-[#e8e9eb] dark:hover:bg-slate-700 transition-colors [touch-action:manipulation] flex items-center justify-center"
          >
            How to Play
          </Link>
        </div>

        <div className="pt-4 sm:pt-8 border-t border-[#d3d6da] dark:border-gray-600 w-full flex flex-col gap-6 sm:gap-10">
          <div className="flex justify-center">
            <a
              href="https://ko-fi.com/guygir"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-pink-100 hover:bg-pink-200 dark:bg-[#1a2332] dark:hover:bg-[#13C3FF] dark:border-2 dark:border-[#13C3FF]/70 text-amber-900 dark:text-white font-semibold rounded-lg transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_28px_-4px_rgba(236,72,153,0.38)] dark:shadow-[0_0_20px_-4px_rgba(19,195,255,0.35)]"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-amber-800 dark:fill-current"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" />
              </svg>
              Buy me a cup of Ko-fi
            </a>
          </div>
          {/* Community Polls */}
          <PollWidget puzzleTypeDistribution={getPuzzleTypeDistribution()} />

          <HonorableMentions />
          
          {/* Daily Players Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border-2 border-[#d3d6da] dark:border-gray-600">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#1a1a1b] dark:text-gray-100">
              📈 Daily Players
            </h2>
            <div className="w-full h-[220px] sm:h-[260px] flex justify-center items-center">
              <DailyPlaysChart />
            </div>
          </div>
          
          {/* Latest Updates */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border-2 border-[#d3d6da] dark:border-gray-600">
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#1a1a1b] dark:text-gray-100">
              📣 Latest Updates
            </h2>
            <ul className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 list-none p-0 space-y-1.5 sm:space-y-2">
              {(versionData.updates as Array<{ version: string; note: string }>).map((u) => (
                <li key={u.version}>v{u.version} - {u.note}</li>
              ))}
            </ul>
          </div>
          
          {/* GitHub Link - Moved to bottom */}
          <div className="flex flex-col items-center justify-center gap-2 text-center pt-4">
            <a
              href={process.env.NEXT_PUBLIC_GITHUB_REPO || "https://github.com/guygir/Holdemle"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-[#1a1a1b] dark:hover:text-gray-100 transition-colors"
            >
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span className="text-sm sm:text-base">Open to contributions</span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

// Made with Bob
