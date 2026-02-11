import { cardToDisplay, isRedSuit } from "@/lib/poker/deck";

interface PokerHandProps {
  cards: [string, string];
  feedback?: "exact" | "high" | "low";
  guessedPercent?: number;
  actualPercent?: number;
  showPercent?: boolean;
  showFeedbackEmoji?: boolean;
}

const feedbackColors = {
  exact: "bg-[#6aaa64] text-white",
  high: "bg-[#85c0f9] text-white",
  low: "bg-[#f5793a] text-white",
};

const feedbackEmojis = {
  exact: "✓",
  high: "↓",
  low: "↑",
};

export function PokerHand({
  cards,
  feedback,
  guessedPercent,
  actualPercent,
  showPercent = true,
  showFeedbackEmoji = false,
}: PokerHandProps) {
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg border ${
        feedback ? feedbackColors[feedback] : "bg-[#f6f7f8] border-[#d3d6da]"
      }`}
    >
      <div className="flex gap-1">
        {cards.map((card) => (
          <div
            key={card}
            className={`w-10 h-14 rounded flex flex-col items-center justify-center text-sm font-bold ${
              feedback ? "bg-white/20" : "bg-white border border-[#d3d6da]"
            } ${isRedSuit(card) ? "text-red-600" : "text-black"}`}
          >
            {cardToDisplay(card)}
          </div>
        ))}
      </div>
      {showPercent && (
        <div className="ml-auto font-semibold flex items-center gap-1 flex-shrink-0 min-w-[4ch]">
          {guessedPercent !== undefined && (
            <span>{guessedPercent}%</span>
          )}
          {showFeedbackEmoji && feedback && (
            <span className="text-lg" title={
              feedback === "exact" ? "Exact!" :
              feedback === "high" ? "Too high (actual lower)" : "Too low (actual higher)"
            }>
              {feedbackEmojis[feedback]}
            </span>
          )}
          {actualPercent !== undefined && guessedPercent !== actualPercent && (
            <span className="opacity-80 text-sm ml-1">
              (actual: {actualPercent}%)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
