import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="text-4xl font-bold text-[#1a1a1b]">
          🃏 Poker Wordle
        </h1>
        <p className="text-lg text-gray-600">
          Guess the pre-flop odds daily!
        </p>

        <div className="space-y-4">
          <Link
            href="/game"
            className="block w-full min-h-[44px] py-3 px-6 bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] transition-colors [touch-action:manipulation] flex items-center justify-center"
          >
            Play Today&apos;s Puzzle
          </Link>
          <Link
            href="/leaderboard"
            className="block w-full min-h-[44px] py-3 px-6 bg-[#f6f7f8] text-[#1a1a1b] font-semibold rounded-lg border border-[#d3d6da] hover:bg-[#e8e9eb] transition-colors [touch-action:manipulation] flex items-center justify-center"
          >
            View Leaderboard
          </Link>
          <Link
            href="/auth/login"
            className="block w-full min-h-[44px] py-3 px-6 text-gray-600 font-medium hover:text-[#1a1a1b] transition-colors [touch-action:manipulation] flex items-center justify-center"
          >
            Login / Sign Up
          </Link>
          <Link
            href="/how-to-play"
            className="block w-full min-h-[44px] py-3 text-sm text-gray-500 hover:text-[#1a1a1b] transition-colors [touch-action:manipulation] flex items-center justify-center"
          >
            How to Play
          </Link>
        </div>

        <div className="pt-8 border-t border-[#d3d6da]">
          <p className="text-sm text-gray-500">📊 Latest Updates</p>
          <p className="text-sm text-gray-600 mt-1">v1.0 - We&apos;re live!</p>
        </div>
      </div>
    </main>
  );
}
