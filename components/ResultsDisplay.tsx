import { PokerHand } from "./PokerHand";
import { cardToDisplay, isRedSuit } from "@/lib/poker/deck";

interface GuessWithFeedback {
  position: number;
  percent: number;
  feedback: "exact" | "high" | "low";
}

interface GuessAttempt {
  attempt: number;
  guesses: GuessWithFeedback[];
}

interface ResultsDisplayProps {
  guessHistory: GuessAttempt[];
  hands: Array<{ position: number; cards: [string, string] }>;
  actualPercentages: Array<{ position: number; percent: number }>;
  score: number;
  guessesUsed: number;
  isSolved: boolean;
  rank?: number;
}

export function ResultsDisplay({
  guessHistory,
  hands,
  actualPercentages,
  score,
  guessesUsed,
  isSolved,
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
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-center">
        {isSolved
          ? `Solved in ${guessesUsed} guess${guessesUsed > 1 ? "es" : ""}! 🎉`
          : "Better luck next time!"}
      </h2>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1">
        {guessHistory.map((attempt, idx) => {
          const sorted = [...attempt.guesses].sort(
            (a, b) => b.percent - a.percent
          );
          return (
            <div
              key={attempt.attempt}
              className={`flex-shrink-0 w-[200px] flex flex-col ${
                idx > 0 ? "border-l-2 border-[#d3d6da] pl-4" : ""
              }`}
            >
              <p className="text-sm font-medium text-gray-600 mb-2">
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
        <div className="flex-shrink-0 w-[200px] flex flex-col border-l-2 border-[#d3d6da] pl-4">
          <p className="text-sm font-medium text-gray-600 mb-2">
            Correct:
          </p>
          <div className="space-y-2">
            {sortedActual.map((a) => {
              const hand = hands.find((h) => h.position === a.position);
              if (!hand) return null;
              return (
                <div
                  key={a.position}
                  className="flex items-center gap-2 p-3 rounded-lg border bg-[#f6f7f8] border-[#d3d6da] min-w-0"
                >
                  <div className="flex gap-1 flex-shrink-0">
                    {hand.cards.map((card) => (
                      <div
                        key={card}
                        className={`w-10 h-14 rounded flex flex-col items-center justify-center text-sm font-bold bg-white border border-[#d3d6da] ${
                          isRedSuit(card) ? "text-red-600" : "text-black"
                        }`}
                      >
                        {cardToDisplay(card)}
                      </div>
                    ))}
                  </div>
                  <span className="font-bold text-[#1a1a1b] ml-auto shrink-0 w-12 text-right">
                    {getPercent(a)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#d3d6da] space-y-1">
        <p className="font-semibold">
          Score: {score}
          {guessesUsed === 1 && " (perfect!)"}
        </p>
        {rank && (
          <p className="text-gray-600">Rank: #{rank} today</p>
        )}
      </div>
    </div>
  );
}
