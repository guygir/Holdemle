"use client";

import { PokerHand } from "./PokerHand";
import { FlopDisplay } from "./FlopDisplay";
import { cardToDisplay } from "@/lib/poker/deck";
import { getCardColor } from "@/lib/deck-colors";
import { useDeckColors } from "@/components/DeckColorProvider";
import { MAX_GUESSES } from "@/lib/game-config";

interface GuessWithFeedback {
  position: number;
  percent: number;
  feedback: "exact" | "high" | "low";
}

interface GuessAttempt {
  attempt: number;
  guesses: GuessWithFeedback[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface ResultsDisplayProps {
  guessHistory: GuessAttempt[];
  hands: Array<{ position: number; cards: [string, string] }>;
  flop?: [string, string, string];
  actualPercentages: Array<{ position: number; percent: number }>;
  guessesUsed: number;
  isSolved: boolean;
  timeInSeconds: number;
  percentDiff: number;
  rank?: number;
}

export function ResultsDisplay({
  guessHistory,
  hands,
  flop,
  actualPercentages,
  guessesUsed,
  isSolved,
  timeInSeconds,
  percentDiff,
  rank,
}: ResultsDisplayProps) {
  const { scheme } = useDeckColors();
  const getPercent = (a: { position: number; percent?: number; actualPercent?: number }) =>
    a.percent ?? (a as { actualPercent?: number }).actualPercent ?? 0;

  const byPositionActual = [...actualPercentages]
    .map((a) => ({ ...a, percent: getPercent(a) }))
    .sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-2 sm:space-y-4 w-full max-w-full min-w-0">
      <h2 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold text-center text-[#1a1a1b] dark:text-gray-100">
        {isSolved
          ? `Solved in ${guessesUsed} guess${guessesUsed > 1 ? "es" : ""}! 🎉`
          : "Better luck next time!"}
      </h2>

      {/* LOSS/WON/Guesses/Time - ABOVE Correct */}
      <div className="flex flex-wrap gap-x-4 sm:gap-x-8 gap-y-2 text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold">
        <span className={isSolved ? "text-[#6aaa64]" : "text-[#dc2626]"}>
          {isSolved ? "WON" : "LOSS"}
        </span>
        <span className="text-gray-600 dark:text-gray-400 font-semibold">
          Guesses: {guessesUsed}/{MAX_GUESSES}
        </span>
        <span className="text-gray-600 dark:text-gray-400 font-semibold">
          Time: {formatTime(timeInSeconds)}
        </span>
        {percentDiff > 0 && (
          <span className="text-gray-600 dark:text-gray-400 font-semibold">
            Difference: Δ{percentDiff.toFixed(0)}%
          </span>
        )}
      </div>
      {rank && (
        <p className="text-base sm:text-xl lg:text-2xl xl:text-3xl text-gray-600 dark:text-gray-400 font-semibold">Rank: #{rank} today</p>
      )}

      {/* Correct row - on TOP */}
      <div className="flex flex-col gap-1 pt-1 border-t border-[#d3d6da] dark:border-gray-600">
        {flop && (
          <div className="mb-2">
            <FlopDisplay flop={flop} />
          </div>
        )}
        <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
          Correct:
        </p>
        <div className="flex flex-wrap gap-1 sm:gap-2 w-full">
          {byPositionActual.map((a) => {
            const hand = hands.find((h) => h.position === a.position);
            if (!hand) return null;
            const lastAttempt = guessHistory[guessHistory.length - 1];
            const lastGuess = lastAttempt?.guesses.find((g) => g.position === a.position);
            const actual = getPercent(a);
            const guessed = lastGuess?.percent ?? 0;
            const diff = lastGuess && lastGuess.feedback !== "exact"
              ? Math.round(Math.abs(guessed - actual))
              : 0;
            const isCorrect = diff === 0;
            return (
            <div
              key={a.position}
              className={`flex flex-col items-center gap-0 rounded-lg border p-2 sm:p-3 lg:p-4 flex-1 min-w-0 ${
                isCorrect ? "bg-[#6aaa64] border-[#5a9a54] text-white" : "bg-[#dc2626] border-[#b91c1c] text-white"
              }`}
            >
                <div className="flex flex-shrink-0 gap-0.5 sm:gap-1 lg:gap-2">
                  {hand.cards.map((card) => (
                    <div
                      key={card}
                      className="rounded flex flex-col items-center justify-center font-bold bg-white dark:bg-white border border-[#d3d6da] dark:border-[#d3d6da] w-8 h-11 sm:w-10 sm:h-14 lg:w-12 lg:h-16 xl:w-14 xl:h-20 text-xs sm:text-sm lg:text-base"
                      style={{ color: getCardColor(card, scheme) }}
                    >
                      {cardToDisplay(card)}
                    </div>
                  ))}
                </div>
                <div className="shrink-0 text-center flex flex-row items-center justify-center gap-0 font-semibold text-sm sm:text-base lg:text-lg">
                  <span className="font-bold text-white">
                    {actual}%
                  </span>
                  {isCorrect ? (
                    <span className="text-sm sm:text-base text-white">✓</span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] font-semibold text-white">
                      (Δ{diff}%)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guesses - newest on TOP (reverse order) */}
      <div className="space-y-2 sm:space-y-3">
        {[...guessHistory].reverse().map((attempt) => {
          const byPosition = [...attempt.guesses].sort(
            (a, b) => a.position - b.position
          );
          return (
            <div key={attempt.attempt} className="flex flex-col gap-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                Guess {attempt.attempt}:
              </p>
              <div className={`${
                hands.length === 5
                  ? 'flex flex-nowrap gap-0 overflow-x-auto w-full'
                  : hands.length === 3
                  ? 'w-full grid grid-cols-3 gap-1 sm:gap-2'
                  : 'w-full grid grid-cols-4 gap-1 sm:gap-2'
              }`}>
                {byPosition.map((g) => {
                  const hand = hands.find((h) => h.position === g.position);
                  if (!hand) return null;
                  return (
                    <PokerHand
                      key={g.position}
                      cards={hand.cards}
                      feedback={g.feedback}
                      guessedPercent={g.percent}
                      showPercent
                      showFeedbackEmoji
                      handCount={hands.length}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
