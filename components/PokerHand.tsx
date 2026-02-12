import { cardToDisplay, isRedSuit } from "@/lib/poker/deck";

interface PokerHandProps {
  cards: [string, string];
  feedback?: "exact" | "high" | "low";
  guessedPercent?: number;
  actualPercent?: number;
  showPercent?: boolean;
  showFeedbackEmoji?: boolean;
  size?: "normal" | "large";
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
  size = "normal",
}: PokerHandProps) {
  const isLarge = size === "large";
  return (
    <div
      className={`flex items-center gap-1 sm:gap-2 p-2 sm:p-3 lg:p-4 rounded-lg border ${
        isLarge ? "min-w-[200px] sm:min-w-[260px] lg:min-w-[320px]" : ""
      } ${isLarge && !showPercent ? "justify-center" : ""} ${
        feedback ? feedbackColors[feedback] : "bg-[#f6f7f8] border-[#d3d6da]"
      }`}
    >
      <div className={`flex gap-0.5 sm:gap-1 lg:gap-2 ${isLarge ? "gap-1 sm:gap-2 lg:gap-3" : ""}`}>
        {cards.map((card) => (
          <div
            key={card}
            className={`w-8 h-11 sm:w-10 sm:h-14 lg:w-12 lg:h-16 xl:w-14 xl:h-20 rounded flex flex-col items-center justify-center text-xs sm:text-sm lg:text-base font-bold ${
              feedback ? "bg-white/20" : "bg-white border border-[#d3d6da]"
            } ${isRedSuit(card) ? "text-red-600" : "text-black"}`}
          >
            {cardToDisplay(card)}
          </div>
        ))}
      </div>
      {showPercent && (
        <div className="ml-auto font-semibold flex flex-col items-center flex-shrink-0 min-w-[4ch]">
          {guessedPercent !== undefined && (
            <span>{guessedPercent}%</span>
          )}
          {showFeedbackEmoji && feedback && (
            <span className="text-sm sm:text-lg leading-tight" title={
              feedback === "exact" ? "Exact!" :
              feedback === "high" ? "Too high (actual lower)" : "Too low (actual higher)"
            }>
              {feedbackEmojis[feedback]}
            </span>
          )}
          {actualPercent !== undefined && guessedPercent !== actualPercent && (
            <span className="opacity-80 text-xs sm:text-sm mt-0.5">
              (actual: {actualPercent}%)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
