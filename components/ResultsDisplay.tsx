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

  const actualMap = Object.fromEntries(
    actualPercentages.map((a) => [a.position, getPercent(a)])
  );

  const sortedActual = [...actualPercentages]
    .map((a) => ({ ...a, percent: getPercent(a) }))
    .sort((a, b) => b.percent - a.percent);

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      <h2 className="text-xl lg:text-2xl xl:text-3xl font-bold text-center">
        {isSolved
          ? `Solved in ${guessesUsed} guess${guessesUsed > 1 ? "es" : ""}! 🎉`
          : "Better luck next time!"}
      </h2>

      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-1 w-full max-w-full min-w-0 justify-center">
        {guessHistory.map((attempt, idx) => {
          const sorted = [...attempt.guesses].sort(
            (a, b) => b.percent - a.percent
          );
          return (
            <div
              key={attempt.attempt}
              className={`flex-1 min-w-[180px] sm:min-w-[200px] lg:min-w-[240px] xl:min-w-[260px] flex flex-col pl-2 sm:pl-3 ${
                idx > 0 ? "border-l-2 border-[#d3d6da]" : ""
              }`}
            >
              <p className="text-sm lg:text-lg font-medium text-gray-600 mb-2">
                Guess {attempt.attempt}:
              </p>
              <div className="space-y-2">
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
        <div className="flex-1 min-w-[180px] sm:min-w-[200px] lg:min-w-[240px] xl:min-w-[260px] flex flex-col border-l-2 border-[#d3d6da] pl-2 sm:pl-3">
          <p className="text-sm lg:text-lg font-medium text-gray-600 mb-2">
            Correct:
          </p>
          <div className="space-y-2">
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
                  className={`flex items-center gap-2 p-3 lg:p-4 rounded-lg border min-w-0 ${
                    isCorrect ? "bg-[#6aaa64] border-[#5a9a54] text-white" : "bg-[#dc2626] border-[#b91c1c] text-white"
                  }`}
                >
                  <div className="flex gap-1 lg:gap-2 flex-shrink-0">
                    {hand.cards.map((card) => (
                      <div
                        key={card}
                        className={`w-10 h-14 lg:w-12 lg:h-16 xl:w-14 xl:h-20 rounded flex flex-col items-center justify-center text-sm lg:text-base font-bold bg-white border border-[#d3d6da] ${
                          isRedSuit(card) ? "text-red-600" : "text-black"
                        }`}
                      >
                        {cardToDisplay(card)}
                      </div>
                    ))}
                  </div>
                  <div className="ml-auto shrink-0 w-12 text-right flex flex-col items-end">
                    <span className="font-bold text-white text-sm lg:text-lg">
                      {actual}%
                    </span>
                    {diff > 0 && (
                      <span className="text-xs lg:text-base font-semibold text-white">
                        (Δ{diff}%)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#d3d6da] space-y-2">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xl lg:text-2xl xl:text-3xl font-bold text-[#1a1a1b]">
          <span>
            {isSolved ? "Win" : "Loss"}
          </span>
          <span className="text-gray-600 font-semibold">
            {guessesUsed}/{MAX_GUESSES} guesses
          </span>
          <span className="text-gray-600 font-semibold">
            {formatTime(timeInSeconds)}
          </span>
          {percentDiff > 0 && (
            <span className="text-gray-600 font-semibold">
              Δ{percentDiff.toFixed(0)}%
            </span>
          )}
        </div>
        {rank && (
          <p className="text-xl lg:text-2xl xl:text-3xl text-gray-600 font-semibold">Rank: #{rank} today</p>
        )}
      </div>
    </div>
  );
}
