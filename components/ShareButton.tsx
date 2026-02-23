"use client";

import { useState, useCallback } from "react";
import { formatShareText } from "@/lib/utils/share-text";

interface GuessAttempt {
  attempt: number;
  guesses: Array<{
    position: number;
    percent: number;
    feedback: "exact" | "high" | "low";
  }>;
}

interface ShareButtonProps {
  guessHistory: GuessAttempt[];
  date: string;
  isSolved: boolean;
  guessesUsed: number;
  className?: string;
}

export function ShareButton({
  guessHistory,
  date,
  isSolved,
  guessesUsed,
  className = "",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const text = formatShareText(guessHistory, date, isSolved, guessesUsed);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        window.prompt("Copy to clipboard (Ctrl+C):", text);
      }
    } catch {
      window.prompt("Copy to clipboard (Ctrl+C):", text);
    }
  }, [guessHistory, date, isSolved, guessesUsed]);

  return (
    <button
      onClick={handleShare}
      className={`py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg font-medium text-sm sm:text-base lg:text-xl transition-colors border ${
        copied
          ? "bg-[#6aaa64] text-white border-[#5a9a54]"
          : "bg-[#f6f7f8] dark:bg-gray-700 text-[#1a1a1b] dark:text-gray-100 border-[#d3d6da] dark:border-gray-600 hover:bg-[#e8e9eb] dark:hover:bg-gray-600"
      } ${className}`}
    >
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
