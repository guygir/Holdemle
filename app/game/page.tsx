"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PokerHand } from "@/components/PokerHand";
import { Timer } from "@/components/Timer";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { ShareButton } from "@/components/ShareButton";
import { MAX_GUESSES } from "@/lib/game-config";

const TUTORIAL_KEY = "poker-wordle-seen-tutorial";
const FEEDBACK_TUTORIAL_KEY = "poker-wordle-seen-feedback-tutorial";

interface Hand {
  position: number;
  cards: [string, string];
}

interface PuzzleData {
  puzzleId: string;
  date: string;
  nickname?: string;
  hands: Hand[];
  difficulty: string;
  userHasGuessed: boolean;
    userGuess?: {
      submittedAt?: string;
      timeTakenSeconds?: number;
      percentDiff?: number;
      gameStartedAt?: string | null;
      pausedElapsedSeconds?: number | null;
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

function GameContent() {
  const searchParams = useSearchParams();
  const isDemoMode = useMemo(
    () => searchParams.get("demo") === "1",
    [searchParams]
  );
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [showTutorial, setShowTutorial] = useState(false);
  const [showFeedbackTutorial, setShowFeedbackTutorial] = useState(false);

  const fetchPuzzle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = isDemoMode ? "/api/puzzle/daily?demo=1" : "/api/puzzle/daily";
      const res = await fetch(url, { cache: "no-store", credentials: "include" });
      const json = await res.json();
      if (json.success) {
        const data = json.data;
        setPuzzle(data);
        const prevGuess = data.userGuess;
        setGuesses(
          Object.fromEntries(
            (data.hands as Hand[]).map((h) => [h.position, 0])
          )
        );
        if (prevGuess?.pausedElapsedSeconds != null && prevGuess.pausedElapsedSeconds > 0) {
          setStartTime(Date.now() - prevGuess.pausedElapsedSeconds * 1000);
        } else if (prevGuess?.gameStartedAt) {
          const start = new Date(prevGuess.gameStartedAt).getTime();
          setStartTime(Math.min(start, Date.now()));
        } else if (prevGuess?.submittedAt && prevGuess.timeTakenSeconds != null) {
          const start = new Date(prevGuess.submittedAt).getTime() - prevGuess.timeTakenSeconds * 1000;
          setStartTime(Math.min(start, Date.now()));
        }
      } else {
        setError(json.error || "Failed to load puzzle");
      }
    } catch (err) {
      setError("Failed to load puzzle");
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    fetchPuzzle();
  }, [fetchPuzzle]);

  // Pause timer when leaving the page (only for real game, in-progress)
  const isGameOver = puzzle?.userGuess?.isSolved || (puzzle?.userGuess?.guessesUsed ?? 0) >= MAX_GUESSES;
  useEffect(() => {
    if (isDemoMode || !puzzle?.puzzleId || puzzle.puzzleId === "demo-puzzle") return;
    if (isGameOver) return;

    const puzzleId = puzzle.puzzleId;
    const startRef = { current: startTime };

    const savePauseState = () => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      fetch("/api/puzzle/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId, elapsedSeconds: elapsed }),
        credentials: "include",
        keepalive: true,
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.hidden) savePauseState();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", savePauseState);

    return () => {
      savePauseState();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", savePauseState);
    };
  }, [isDemoMode, puzzle?.puzzleId, isGameOver, startTime]);

  useEffect(() => {
    if (isDemoMode && puzzle && typeof window !== "undefined") {
      const seen = localStorage.getItem(TUTORIAL_KEY);
      if (!seen) setShowTutorial(true);
    }
  }, [isDemoMode, puzzle]);

  useEffect(() => {
    if (
      isDemoMode &&
      puzzle?.userGuess?.guessHistory?.length === 1 &&
      typeof window !== "undefined"
    ) {
      const seen = localStorage.getItem(FEEDBACK_TUTORIAL_KEY);
      if (!seen) setShowFeedbackTutorial(true);
    }
  }, [isDemoMode, puzzle?.userGuess?.guessHistory?.length]);

  const dismissTutorial = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TUTORIAL_KEY, "1");
      setShowTutorial(false);
    }
  }, []);

  const dismissFeedbackTutorial = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(FEEDBACK_TUTORIAL_KEY, "1");
      setShowFeedbackTutorial(false);
    }
  }, []);

  const total = Object.values(guesses).reduce((a, b) => a + b, 0);
  const attemptNumber = puzzle?.userGuess
    ? puzzle.userGuess.guessesUsed + 1
    : 1;

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
        const timeInSeconds = Math.floor((Date.now() - startTime) / 1000);
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
            timeTakenSeconds: timeInSeconds,
            percentDiff: json.data.percentDiff ?? 0,
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
    const isPuzzleComing = error === "No puzzle for today";
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        {isPuzzleComing ? (
          <>
            <p className="text-xl sm:text-2xl font-semibold text-[#1a1a1b] mb-2">
              Today&apos;s puzzle is coming up shortly!
            </p>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Check back in a moment. Our daily puzzle will be ready soon.
            </p>
          </>
        ) : (
          <>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Make sure you have a puzzle for today. Run the puzzle generation script
              to create puzzles.
            </p>
          </>
        )}
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
    <div className="flex justify-center w-full">
      <main className="min-h-screen flex flex-col p-2 sm:p-4 w-full max-w-[96vw]">
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-sm shadow-xl">
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#1a1a1b] mb-2 sm:mb-3">
              How to Play
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              Guess the pre-flop win percentages for 4 poker hands. Your guesses
              must sum to <strong>100%</strong>. You get{" "}
              <strong>{MAX_GUESSES} guesses</strong>.
            </p>
            <button
              onClick={dismissTutorial}
              className="w-full min-h-[36px] sm:min-h-[44px] py-2 sm:py-3 text-sm sm:text-base bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {showFeedbackTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-sm shadow-xl">
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#1a1a1b] mb-2 sm:mb-3">
              Understanding Feedback
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3">
              Each hand gets color-coded feedback based on your guess:
            </p>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-base lg:text-lg text-gray-700 mb-3 sm:mb-4">
              <li className="flex items-center gap-2">
                <span className="inline-block w-6 h-6 rounded bg-[#6aaa64] flex-shrink-0" />
                <strong>Exact</strong> — Your guess matches the actual percentage
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block w-6 h-6 rounded bg-[#85c0f9] flex-shrink-0" />
                <strong>Too high</strong> — The actual % is lower; guess less next time
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block w-6 h-6 rounded bg-[#f5793a] flex-shrink-0" />
                <strong>Too low</strong> — The actual % is higher; guess more next time
              </li>
            </ul>
            <button
              onClick={dismissFeedbackTutorial}
              className="w-full min-h-[36px] sm:min-h-[44px] py-2 sm:py-3 text-sm sm:text-base bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      <header className="flex flex-col gap-0.5 mb-3 sm:mb-6">
        <div className="flex justify-between items-center min-h-9 sm:min-h-11">
          <Link href="/" className="text-base sm:text-lg lg:text-2xl font-bold text-[#1a1a1b] py-1 -my-1 sm:py-2 sm:-my-2 min-h-[36px] sm:min-h-[44px] flex items-center">
            🃏 Poker Wordle
          </Link>
          <span className="text-xs sm:text-base lg:text-xl text-gray-600">
          {isDemoMode ? (
            <span className="bg-[#85c0f9]/20 text-[#85c0f9] px-2 py-0.5 rounded font-medium">
              Demo
            </span>
          ) : (
            new Date(puzzle.date).toLocaleDateString()
          )}
          </span>
        </div>
        {puzzle.nickname && !isDemoMode && (
          <p className="text-xs sm:text-base lg:text-xl text-gray-600">Hello, {puzzle.nickname}</p>
        )}
      </header>

      {isGameOver && puzzle.userGuess ? (
        <div className="flex flex-col min-h-0">
          <ResultsDisplay
            guessHistory={puzzle.userGuess.guessHistory}
            hands={puzzle.hands}
            actualPercentages={puzzle.userGuess.actualPercentages}
            guessesUsed={puzzle.userGuess.guessesUsed}
            isSolved={puzzle.userGuess.isSolved}
            timeInSeconds={puzzle.userGuess.timeTakenSeconds ?? 0}
            percentDiff={puzzle.userGuess.percentDiff ?? 0}
          />
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
            <ShareButton
              guessHistory={puzzle.userGuess.guessHistory}
              date={puzzle.date}
              isSolved={puzzle.userGuess.isSolved}
              guessesUsed={puzzle.userGuess.guessesUsed}
              className="flex-1 min-h-[36px] sm:min-h-[44px] lg:min-h-[52px] py-1.5 sm:py-2 lg:py-3 text-sm sm:text-base lg:text-xl px-3 sm:px-4 hover:bg-[#e8e9eb]"
            />
            {isDemoMode ? (
              <div className="flex-1 flex flex-col gap-2">
                <Link
                  href="/game"
                  className="min-h-[36px] sm:min-h-[44px] lg:min-h-[52px] py-1.5 sm:py-2 lg:py-3 text-sm sm:text-base lg:text-xl px-3 sm:px-4 bg-[#6aaa64] text-white rounded-lg font-medium hover:bg-[#5a9a54] transition-colors [touch-action:manipulation] flex items-center justify-center"
                >
                  Play for Real
                </Link>
                <p className="text-center text-xs sm:text-base lg:text-lg text-gray-500">
                  Sign up to play daily puzzles and save your scores
                </p>
              </div>
            ) : (
              <Link
                href="/"
                className="flex-1 min-h-[36px] sm:min-h-[44px] lg:min-h-[52px] py-1.5 sm:py-2 lg:py-3 text-sm sm:text-base lg:text-xl px-3 sm:px-4 bg-[#f6f7f8] border border-[#d3d6da] rounded-lg font-medium hover:bg-[#e8e9eb] transition-colors [touch-action:manipulation] flex items-center justify-center"
              >
                Back to Home
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-col max-h-[48vh] shrink-0 overflow-y-auto">
          <div className="mb-1 sm:mb-2 flex justify-between text-xs sm:text-base lg:text-xl">
            <span>Guess {attemptNumber} of {MAX_GUESSES}</span>
            <Timer startTime={startTime} className="font-mono text-xs sm:text-base lg:text-xl" />
          </div>

          <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-4 flex flex-col items-center">
            {puzzle.hands.map((hand) => (
              <div key={hand.position} className="flex items-center gap-1.5 sm:gap-3 justify-center">
                <div className="flex-initial max-w-[280px] sm:max-w-[360px]">
                  <PokerHand
                    cards={hand.cards}
                    showPercent={false}
                    size="large"
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
                    className="w-14 sm:w-20 lg:w-24 min-h-[36px] sm:min-h-[44px] lg:min-h-[52px] px-1 sm:px-2 py-1 sm:py-2 text-sm sm:text-base lg:text-xl border border-[#d3d6da] rounded text-center font-semibold [touch-action:manipulation]"
                  />
                  <span className="text-sm sm:text-base lg:text-xl">%</span>
                </div>
              </div>
            ))}
          </div>

          <p
            className={`text-xs sm:text-base lg:text-xl mb-1 sm:mb-2 ${
              total === 100 ? "text-[#6aaa64]" : "text-gray-600"
            }`}
          >
            Total: {total}% (must equal 100%)
          </p>

          {submitError && (
            <p className="text-red-600 text-xs sm:text-base lg:text-lg mb-2">{submitError}</p>
          )}
          </div>

          <div className="mt-2 sm:mt-4 flex-1 min-h-0 flex flex-col">
            <button
              onClick={handleSubmit}
              disabled={total !== 100 || submitting}
              className="w-full min-h-[36px] sm:min-h-[40px] py-1.5 sm:py-2 text-sm sm:text-base lg:text-lg bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] disabled:opacity-50 disabled:cursor-not-allowed transition-colors [touch-action:manipulation] shrink-0"
            >
              {submitting ? "Submitting..." : "Submit Guess"}
            </button>
            {puzzle.userGuess?.guessHistory && puzzle.userGuess.guessHistory.length > 0 && (
            <div className="mt-2 sm:mt-3 flex-1 min-h-0 overflow-y-auto">
              <p className="text-xs sm:text-base lg:text-xl font-medium text-gray-600 mb-1 sm:mb-2">
                Previous Guesses:
              </p>
              <div className="space-y-2 sm:space-y-3">
                {[...puzzle.userGuess.guessHistory].reverse().map((attempt) => {
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
          </div>
        </div>
      )}

      <nav className="mt-4 sm:mt-8 flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-base lg:text-xl">
        <Link href="/leaderboard" className="text-[#6aaa64] hover:underline py-1 sm:py-2 min-h-[32px] sm:min-h-[44px] flex items-center">
          Leaderboard
        </Link>
        {!isDemoMode && (
          <Link href="/stats" className="text-[#6aaa64] hover:underline py-1 sm:py-2 min-h-[32px] sm:min-h-[44px] flex items-center">
            Stats
          </Link>
        )}
        <Link href="/how-to-play" className="text-[#6aaa64] hover:underline py-1 sm:py-2 min-h-[32px] sm:min-h-[44px] flex items-center">
          How to Play
        </Link>
      </nav>
      </main>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-6">
          <p className="text-gray-600">Loading puzzle...</p>
        </main>
      }
    >
      <GameContent />
    </Suspense>
  );
}
