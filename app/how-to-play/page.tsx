import Link from "next/link";
import { MAX_GUESSES } from "@/lib/game-config";

export default function HowToPlayPage() {
  return (
    <div className="flex justify-center w-full">
      <main className="min-h-screen flex flex-col p-2 sm:p-4 w-full max-w-[96vw]">
      <header className="flex justify-between items-center mb-3 sm:mb-6 min-h-9 sm:min-h-11">
        <Link href="/" className="text-base sm:text-lg lg:text-2xl font-bold text-[#1a1a1b] dark:text-gray-100 py-1 -my-1 sm:py-2 sm:-my-2 min-h-[36px] sm:min-h-[44px] flex items-center">
          🃏 Hold&apos;emle 🃏
        </Link>
        <Link href="/" className="text-xs sm:text-base lg:text-xl text-gray-600 dark:text-gray-400 hover:text-[#1a1a1b] dark:hover:text-gray-100 py-1 sm:py-2 min-h-[36px] sm:min-h-[44px] flex items-center mr-14">
          ← Back
        </Link>
      </header>

      <h1 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-3 sm:mb-4 text-[#1a1a1b] dark:text-gray-100">How to Play</h1>

      <div className="space-y-4 sm:space-y-6 text-gray-700 dark:text-gray-300 text-xs sm:text-sm lg:text-base">
        <section>
          <h2 className="font-semibold text-[#1a1a1b] dark:text-gray-100 text-sm sm:text-base lg:text-lg">Goal</h2>
          <p>
            Guess the pre-flop winning percentages for 4 poker hands. Your
            percentages must add up to 100%. You get {MAX_GUESSES} guesses to get them all
            exactly right!
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#1a1a1b] dark:text-gray-100 text-sm sm:text-base lg:text-lg">Feedback</h2>
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
          <h2 className="font-semibold text-[#1a1a1b] dark:text-gray-100 text-sm sm:text-base lg:text-lg">Scoring</h2>
          <p>
            Aim to solve in as few guesses as possible and in less time. If you
            run out of guesses, try to keep your difference (Δ%) low—closer to
            the actual percentages means a better score.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-[#1a1a1b] dark:text-gray-100 text-sm sm:text-base lg:text-lg">Tips</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Strong hands (pocket pairs, big aces) usually have higher odds
            </li>
            <li>Weaker hands (low cards, suited connectors) tend to be lower</li>
            <li>All 4 hands compete head-to-head pre-flop</li>
          </ul>
        </section>
      </div>
    </main>
    </div>
  );
}
