"use client";

import { useDeckColors } from "@/components/DeckColorProvider";

export function DeckColorToggle() {
  const { scheme, toggleScheme } = useDeckColors();

  const gradient =
    scheme === "4-color"
      ? "conic-gradient(#000 0deg 90deg, #dc2626 90deg 180deg, #16a34a 180deg 270deg, #2563eb 270deg 360deg)"
      : "conic-gradient(#000 0deg 180deg, #dc2626 180deg 360deg)";

  return (
    <button
      type="button"
      onClick={toggleScheme}
      className="p-1.5 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-100 hover:border-gray-400 dark:hover:bg-gray-700 dark:hover:border-gray-500 transition-colors"
      aria-label={
        scheme === "4-color"
          ? "Switch to 2-color deck (black/red)"
          : "Switch to 4-color deck (green clubs, blue diamonds, red hearts, black spades)"
      }
      title={scheme === "4-color" ? "2-color deck" : "4-color deck"}
    >
      <div
        className="w-6 h-6 rounded-full shrink-0"
        style={{ background: gradient }}
        aria-hidden
      />
    </button>
  );
}
