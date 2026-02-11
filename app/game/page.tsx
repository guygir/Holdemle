"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PokerHand } from "@/components/PokerHand";
import { Timer } from "@/components/Timer";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { ShareButton } from "@/components/ShareButton";
import { MAX_GUESSES } from "@/lib/game-config";

interface Hand {
  position: number;
  cards: [string, string];
}

interface PuzzleData {
  puzzleId: string;
  date: string;
  hands: Hand[];
  difficulty: string;
  userHasGuessed: boolean;
  userGuess?: {
    guessHistory: Array<{
      attempt: number;
      guesses: Array<{
        position: number;
        percent: number;
        feedback: "exact" | "high" | "low";
      }>;
    }>;
    guessesUsed: number;
    isSolved: boolean;
    score: number;
    actualPercentages: Array<{ position: number; percent: number }>;
  };
}

export default function GamePage() {
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(Date.now());

  const fetchPuzzle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/puzzle/daily");
      const json = await res.json();
      if (json.success) {
        setPuzzle(json.data);
        setGuesses(
          Object.fromEntries(
            (json.data.hands as Hand[]).map((h) => [h.position, 0])
          )
        );
      } else {
        setError(json.error || "Failed to load puzzle");
      }
    } catch (err) {
      setError("Failed to load puzzle");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPuzzle();
  }, [fetchPuzzle]);

  const total = Object.values(guesses).reduce((a, b) => a + b, 0);
  const attemptNumber = puzzle?.userGuess
    ? puzzle.userGuess.guessesUsed + 1
    : 1;
  const gameOver =
    puzzle?.userGuess?.isSolved || (puzzle?.userGuess?.guessesUsed ?? 0) >= MAX_GUESSES;

  async function handleSubmit() {
    if (!puzzle || total !== 100 || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    const guessArray = puzzle.hands.map((h) => ({
      position: h.position,
      percent: guesses[h.position] ?? 0,
    }));

    try {
      const res = await fetch("/api/puzzle/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puzzleId: puzzle.puzzleId,
          guesses: guessArray,
          attemptNumber,
          timeInSeconds: Math.floor((Date.now() - startTime) / 1000),
        }),
      });

      const json = await res.json();

      if (json.success) {
        const updated: PuzzleData = {
          ...puzzle,
          userHasGuessed: true,
          userGuess: {
            guessHistory: [
              ...(puzzle.userGuess?.guessHistory ?? []),
              { attempt: attemptNumber, guesses: json.data.feedback },
            ],
            guessesUsed: attemptNumber,
            isSolved: json.data.isSolved,
            score: json.data.totalScore ?? 0,
            actualPercentages:
              json.data.actualPercentages ?? puzzle.userGuess?.actualPercentages ?? [],
          },
        };
        setPuzzle(updated);
        setGuesses(
          Object.fromEntries(
            guessArray.map((g) => [g.position, g.percent])
          )
        );
      } else {
        setSubmitError(json.error || "Failed to submit");
      }
    } catch {
      setSubmitError("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-gray-600">Loading puzzle...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-red-600 mb-4">{error}</p>
        <p className="text-sm text-gray-600 mb-4 text-center">
          Make sure you have a puzzle for today. Run the puzzle generation script
          to create puzzles.
        </p>
        <Link
          href="/"
          className="py-2 px-4 bg-[#6aaa64] text-white rounded-lg"
        >
          Back to Home
        </Link>
      </main>
    );
  }

  if (!puzzle) {
    return null;
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 max-w-lg mx-auto">
      <header className="flex justify-between items-center mb-6 min-h-11">
        <Link href="/" className="text-lg font-bold text-[#1a1a1b] py-2 -my-2 min-h-[44px] flex items-center">
          🃏 Poker Wordle
        </Link>
        <span className="text-sm text-gray-600">
          {new Date(puzzle.date).toLocaleDateString()}
        </span>
      </header>

      {gameOver && puzzle.userGuess ? (
        <>
          <ResultsDisplay
            guessHistory={puzzle.userGuess.guessHistory}
            hands={puzzle.hands}
            actualPercentages={puzzle.userGuess.actualPercentages}
            score={puzzle.userGuess.score}
            guessesUsed={puzzle.userGuess.guessesUsed}
            isSolved={puzzle.userGuess.isSolved}
          />
          <div className="mt-6 flex gap-3">
            <ShareButton
              guessHistory={puzzle.userGuess.guessHistory}
              date={puzzle.date}
              isSolved={puzzle.userGuess.isSolved}
              guessesUsed={puzzle.userGuess.guessesUsed}
              className="flex-1 min-h-[44px] py-2 px-4 hover:bg-[#e8e9eb]"
            />
            <button
              onClick={() => {
                setPuzzle((p) =>
                  p ? { ...p, userHasGuessed: false, userGuess: undefined } : null
                );
                setGuesses(
                  Object.fromEntries(
                    puzzle.hands.map((h) => [h.position, 0])
                  )
                );
                setStartTime(Date.now());
              }}
              className="flex-1 min-h-[44px] py-2 px-4 bg-[#f6f7f8] border border-[#d3d6da] rounded-lg font-medium hover:bg-[#e8e9eb] transition-colors [touch-action:manipulation]"
            >
              Retry (debug)
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 flex justify-between text-sm">
            <span>Guess {attemptNumber} of {MAX_GUESSES}</span>
            <Timer startTime={startTime} className="font-mono" />
          </div>

          <div className="space-y-4 mb-6">
            {puzzle.hands.map((hand) => (
              <div key={hand.position} className="flex items-center gap-3">
                <div className="flex-1">
                  <PokerHand
                    cards={hand.cards}
                    showPercent={false}
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={guesses[hand.position] || ""}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setGuesses((g) => ({
                        ...g,
                        [hand.position]: isNaN(v) ? 0 : Math.min(100, Math.max(0, v)),
                      }));
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    className="w-14 sm:w-16 min-h-[44px] px-2 py-2 text-base border border-[#d3d6da] rounded text-center font-semibold [touch-action:manipulation]"
                  />
                  <span className="text-base">%</span>
                </div>
              </div>
            ))}
          </div>

          <p
            className={`text-sm mb-4 ${
              total === 100 ? "text-[#6aaa64]" : "text-gray-600"
            }`}
          >
            Total: {total}% (must equal 100%)
          </p>

          {submitError && (
            <p className="text-red-600 text-sm mb-2">{submitError}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={total !== 100 || submitting}
            className="w-full min-h-[44px] py-3 bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] disabled:opacity-50 disabled:cursor-not-allowed transition-colors [touch-action:manipulation]"
          >
            {submitting ? "Submitting..." : "Submit Guess"}
          </button>

          {puzzle.userGuess?.guessHistory && puzzle.userGuess.guessHistory.length > 0 && (
            <div className="mt-8">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Previous Guesses:
              </p>
              <div className="flex gap-0 overflow-x-auto pb-2 -mx-1 overscroll-x-contain snap-x snap-mandatory [&>*]:snap-start" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
                {puzzle.userGuess.guessHistory.map((attempt, idx) => {
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
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Guess {attempt.attempt}:
                      </p>
                      <div className="space-y-1">
                        {sorted.map((g) => {
                          const hand = puzzle.hands.find(
                            (h) => h.position === g.position
                          );
                          if (!hand) return null;
                          return (
                            <PokerHand
                              key={g.position}
                              cards={hand.cards}
                              feedback={g.feedback}
                              guessedPercent={g.percent}
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
          )}
        </>
      )}

      <nav className="mt-8 flex flex-wrap gap-3">
        <Link href="/leaderboard" className="text-[#6aaa64] hover:underline py-2 min-h-[44px] flex items-center">
          Leaderboard
        </Link>
        <Link href="/stats" className="text-[#6aaa64] hover:underline py-2 min-h-[44px] flex items-center">
          Stats
        </Link>
        <Link href="/how-to-play" className="text-[#6aaa64] hover:underline py-2 min-h-[44px] flex items-center">
          How to Play
        </Link>
      </nav>
    </main>
  );
}
