import Link from "next/link";
import { MAX_GUESSES, getBaseScore } from "@/lib/game-config";

export default function HowToPlayPage() {
  return (
    <main className="min-h-screen p-4 sm:p-6 max-w-lg lg:max-w-5xl xl:max-w-6xl 2xl:max-w-screen-2xl mx-auto">
      <header className="flex justify-between items-center mb-6 min-h-11">
        <Link href="/" className="text-lg lg:text-xl font-bold text-[#1a1a1b] py-2 -my-2 min-h-[44px] flex items-center">
          🃏 Poker Wordle
        </Link>
        <Link href="/game" className="text-sm lg:text-base text-[#6aaa64] hover:underline py-2 min-h-[44px] flex items-center">
          Play
        </Link>
      </header>

      <h1 className="text-2xl lg:text-3xl font-bold mb-4">How to Play</h1>

      <div className="space-y-6 text-gray-700 text-sm lg:text-base">
        <section>
          <h2 className="font-semibold text-[#1a1a1b] text-base lg:text-lg">Goal</h2>
          <p>
            Guess the pre-flop winning percentages for 4 poker hands. Your
            percentages must add up to 100%. You get {MAX_GUESSES} guesses to get them all
            exactly right!
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#1a1a1b] text-base lg:text-lg">Feedback</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded flex items-center justify-center text-white text-sm"
                style={{ backgroundColor: "#6aaa64" }}
              >
                ✓
              </span>
              <span>
                <strong>Green</strong> – Exact match! You got it right.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded flex items-center justify-center text-white text-sm"
                style={{ backgroundColor: "#85c0f9" }}
              >
                ↓
              </span>
              <span>
                <strong>Blue</strong> – Too high. The actual percentage is
                lower.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded flex items-center justify-center text-white text-sm"
                style={{ backgroundColor: "#f5793a" }}
              >
                ↑
              </span>
              <span>
                <strong>Yellow/Orange</strong> – Too low. The actual percentage
                is higher.
              </span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-[#1a1a1b] text-base lg:text-lg">Scoring</h2>
          <ul className="list-disc list-inside space-y-1">
            {Array.from({ length: MAX_GUESSES }, (_, i) => i + 1).map((n) => (
              <li key={n}>
                Solved in {n} guess{n > 1 ? "es" : ""}: {getBaseScore(n)} base
                points
              </li>
            ))}
            <li>Time bonus: Up to 100 extra points (faster = more)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-[#1a1a1b] text-base lg:text-lg">Tips</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Strong hands (pocket pairs, big aces) usually have higher odds
            </li>
            <li>Weaker hands (low cards, suited connectors) tend to be lower</li>
            <li>All 4 hands compete head-to-head pre-flop</li>
          </ul>
        </section>
      </div>

      <Link
        href="/game"
        className="mt-8 block w-full min-h-[44px] lg:min-h-[52px] lg:py-4 lg:text-xl py-3 text-center bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] transition-colors [touch-action:manipulation] flex items-center justify-center"
      >
        Play Today&apos;s Puzzle
      </Link>
    </main>
  );
}
