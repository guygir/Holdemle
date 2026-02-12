import { PokerHand } from "./PokerHand";
import { cardToDisplay, isRedSuit } from "@/lib/poker/deck";
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
  const s = seconds % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

interface ResultsDisplayProps {
  guessHistory: GuessAttempt[];
  hands: Array<{ position: number; cards: [string, string] }>;
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
  actualPercentages,
  guessesUsed,
  isSolved,
  timeInSeconds,
  percentDiff,
  rank,
}: ResultsDisplayProps) {
  const getPercent = (a: { position: number; percent?: number; actualPercent?: number }) =>
    a.percent ?? (a as { actualPercent?: number }).actualPercent ?? 0;

  const sortedActual = [...actualPercentages]
    .map((a) => ({ ...a, percent: getPercent(a) }))
    .sort((a, b) => b.percent - a.percent);

  return (
    <div className="space-y-2 sm:space-y-4 w-full max-w-full min-w-0">
      <h2 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold text-center">
        {isSolved
          ? `Solved in ${guessesUsed} guess${guessesUsed > 1 ? "es" : ""}! 🎉`
          : "Better luck next time!"}
      </h2>

      {/* LOSS/Guesses/Time - ABOVE Correct */}
      <div className="flex flex-wrap gap-x-4 sm:gap-x-8 gap-y-2 text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold text-[#1a1a1b]">
        <span>
          {isSolved ? "WIN" : "LOSS"}
        </span>
        <span className="text-gray-600 font-semibold">
          Guesses: {guessesUsed}/{MAX_GUESSES}
        </span>
        <span className="text-gray-600 font-semibold">
          Time: {formatTime(timeInSeconds)}
        </span>
        {percentDiff > 0 && (
          <span className="text-gray-600 font-semibold">
            Difference: Δ{percentDiff.toFixed(0)}%
          </span>
        )}
      </div>
      {rank && (
        <p className="text-base sm:text-xl lg:text-2xl xl:text-3xl text-gray-600 font-semibold">Rank: #{rank} today</p>
      )}

      {/* Correct row - on TOP */}
      <div className="flex flex-col gap-1 pt-1 border-t border-[#d3d6da]">
        <p className="text-xs sm:text-sm font-medium text-gray-600">
          Correct:
        </p>
        <div className="grid grid-cols-4 gap-1 sm:gap-2">
          {sortedActual.map((a) => {
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
                className={`flex flex-col items-center gap-0.5 p-1.5 sm:p-2 rounded-lg border min-w-0 ${
                  isCorrect ? "bg-[#6aaa64] border-[#5a9a54] text-white" : "bg-[#dc2626] border-[#b91c1c] text-white"
                }`}
              >
                <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                  {hand.cards.map((card) => (
                    <div
                      key={card}
                      className={`w-6 h-8 sm:w-8 sm:h-11 lg:w-10 lg:h-14 rounded flex flex-col items-center justify-center text-[10px] sm:text-xs font-bold bg-white border border-[#d3d6da] ${
                        isRedSuit(card) ? "text-red-600" : "text-black"
                      }`}
                    >
                      {cardToDisplay(card)}
                    </div>
                  ))}
                </div>
                <div className="shrink-0 text-center flex flex-col items-center">
                  <span className="font-bold text-white text-[10px] sm:text-xs">
                    {actual}%
                  </span>
                  {diff > 0 && (
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
          const sorted = [...attempt.guesses].sort(
            (a, b) => b.percent - a.percent
          );
          return (
            <div key={attempt.attempt} className="flex flex-col gap-1">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Guess {attempt.attempt}:
              </p>
              <div className="grid grid-cols-4 gap-1 sm:gap-2">
                {sorted.map((g) => {
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
