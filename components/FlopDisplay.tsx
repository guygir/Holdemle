"use client";

import { cardToDisplay } from "@/lib/poker/deck";
import { getCardColor } from "@/lib/deck-colors";
import { useDeckColors } from "@/components/DeckColorProvider";

interface FlopDisplayProps {
  flop: [string, string, string];
}

export function FlopDisplay({ flop }: FlopDisplayProps) {
  const { scheme } = useDeckColors();

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
        Flop:
      </p>
      <div className="flex gap-0.5 sm:gap-1 lg:gap-2">
        {flop.map((card) => (
          <div
            key={card}
            className="rounded flex flex-col items-center justify-center font-bold bg-white dark:bg-white border border-[#d3d6da] dark:border-[#d3d6da] w-8 h-11 sm:w-10 sm:h-14 lg:w-12 lg:h-16 xl:w-14 xl:h-20 text-xs sm:text-sm lg:text-base"
            style={{ color: getCardColor(card, scheme) }}
          >
            {cardToDisplay(card)}
          </div>
        ))}
      </div>
    </div>
  );
}
