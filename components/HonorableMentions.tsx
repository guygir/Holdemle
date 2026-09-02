"use client";

import { useEffect, useState } from "react";
import { PokerHand } from "@/components/PokerHand";
import { FlopDisplay } from "@/components/FlopDisplay";
import {
  formatMentionDate,
  type HonorableMention,
} from "@/lib/honorable-mentions";

export default function HonorableMentions() {
  const [mentions, setMentions] = useState<HonorableMention[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/honorable-mentions", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.mentions?.length) {
          setMentions(json.data.mentions);
        } else {
          setMentions([]);
        }
      })
      .catch(() => setMentions([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border-2 border-[#d3d6da] dark:border-gray-600">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#1a1a1b] dark:text-gray-100">
          🏆 Honorable Mentions
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Loading first-guess legends…
        </p>
      </div>
    );
  }

  if (!mentions || mentions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 border-2 border-amber-300/80 dark:border-amber-400/60">
      <h2 className="text-xl sm:text-2xl font-bold mb-1 text-[#1a1a1b] dark:text-gray-100">
        🏆 Honorable Mentions
      </h2>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
        Last three players who solved on the first guess
      </p>
      <ul className="space-y-4">
        {mentions.map((m) => (
          <li
            key={`${m.nickname}-${m.date}-${m.submittedAt}`}
            className="rounded-lg border border-amber-200 dark:border-amber-500/40 bg-amber-50/80 dark:bg-amber-900/20 p-3 sm:p-4 text-left"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-3">
              <p className="text-base sm:text-lg font-bold text-[#1a1a1b] dark:text-gray-100">
                {m.nickname}
              </p>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {formatMentionDate(m.date)}
              </p>
            </div>
            {m.flop && (
              <div className="mb-3 flex justify-center">
                <FlopDisplay flop={m.flop} />
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              {m.hands.map((hand) => (
                <PokerHand
                  key={`${m.date}-${hand.position}`}
                  cards={hand.cards}
                  guessedPercent={hand.percent}
                  feedback="exact"
                  showFeedbackEmoji
                  handCount={m.hands.length}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
