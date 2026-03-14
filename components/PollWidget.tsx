'use client';

interface PollWidgetProps {
  /** Puzzle type distribution: 3, 4, 5 (preflop), 4flop (post-flop) */
  puzzleTypeDistribution: { "3": number; "4": number; "5": number; "4flop": number };
}

export default function PollWidget({ puzzleTypeDistribution }: PollWidgetProps) {
  const d = puzzleTypeDistribution;
  const containerClass = "bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border-2 border-[#d3d6da] dark:border-gray-600";

  return (
    <div className={containerClass}>
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#1a1a1b] dark:text-gray-100">
        📊 Community Polls
      </h2>

      <p className="text-center text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-3">
        No Poll currently.
      </p>

      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-3">
        <p>
          Poll 1 takeaway: {d["3"]}% for 3-hand, {d["4"]}% for 4-hand, {d["5"]}% for 5-hand
        </p>
        <p>
          Poll 2 takeaway: 4-hand post-flop in 1 of every {d["4flop"] > 0 ? Math.round(100 / d["4flop"]) : "—"} daily puzzles
        </p>
      </div>
    </div>
  );
}
