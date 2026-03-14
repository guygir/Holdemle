"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PokerHand } from "@/components/PokerHand";
import { FlopDisplay } from "@/components/FlopDisplay";
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
  flop?: [string, string, string];
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
  const demoParam = useMemo(() => searchParams.get("demo"), [searchParams]);
  const vParam = useMemo(() => searchParams.get("v"), [searchParams]);
  const isDemoMode = useMemo(() => demoParam !== null, [demoParam]);
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(Date.now());
  const [showTutorial, setShowTutorial] = useState(false);
  const [showFeedbackTutorial, setShowFeedbackTutorial] = useState(false);
  const [pausedElapsedSeconds, setPausedElapsedSeconds] = useState<number | null>(null);
  const lastPausedElapsedRef = useRef<number | null>(null);
  const pauseStateRef = useRef<{ puzzleId: string; startTime: number } | null>(null);

  const fetchPuzzle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = vParam
        ? `/api/puzzle/daily?v=${vParam}`
        : demoParam
          ? `/api/puzzle/daily?demo=${demoParam}`
          : "/api/puzzle/daily";
      const res = await fetch(url, { cache: "no-store", credentials: "include" });
      const json = await res.json();
      if (json.success) {
        const data = json.data;
        setPuzzle(data);
        const prevGuess = data.userGuess;
        const lastAttempt = prevGuess?.guessHistory?.[prevGuess.guessHistory.length - 1];
        const numHands = (data.hands as Hand[]).length;
        const defaultPercent = Math.floor(100 / numHands);
        setGuesses(
          lastAttempt
            ? Object.fromEntries(
                lastAttempt.guesses.map((g: { position: number; percent: number }) => [g.position, g.percent])
              )
            : Object.fromEntries(
                (data.hands as Hand[]).map((h, idx) => {
                  // Make last hand equal to 100 - sum of others to ensure total = 100
                  if (idx === numHands - 1) {
                    return [h.position, 100 - defaultPercent * (numHands - 1)];
                  }
                  return [h.position, defaultPercent];
                })
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
  }, [demoParam, vParam]);

  useEffect(() => {
    fetchPuzzle();
  }, [fetchPuzzle]);

  // Pause timer when leaving the page (only for real game, in-progress)
  const isTestPuzzle = puzzle?.puzzleId?.startsWith("test-v");
  const isGameOver = puzzle?.userGuess?.isSolved || (puzzle?.userGuess?.guessesUsed ?? 0) >= MAX_GUESSES;
  pauseStateRef.current =
    !isDemoMode &&
      !isTestPuzzle &&
      puzzle?.puzzleId &&
      !["demo-puzzle", "demo3-puzzle", "demo5-puzzle", "demo-flop-puzzle"].includes(puzzle.puzzleId) &&
      !isGameOver
      ? { puzzleId: puzzle.puzzleId, startTime }
      : null;

  // Play session: start on load, pause on hide (sendBeacon for tab close), resume on show
  useEffect(() => {
    if (
      isDemoMode ||
      !puzzle?.puzzleId ||
      ["demo-puzzle", "demo3-puzzle", "demo5-puzzle", "demo-flop-puzzle"].includes(puzzle.puzzleId)
    )
      return;
    if (isGameOver) return;

    const puzzleId = puzzle.puzzleId;
    const startRef = { current: startTime };

    const sendPause = () => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      lastPausedElapsedRef.current = elapsed;
      setPausedElapsedSeconds(elapsed);
      const body = JSON.stringify({ puzzleId, event: "pause" });
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/puzzle/play-session", blob);
    };

    const sendPauseFetch = () => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      lastPausedElapsedRef.current = elapsed;
      setPausedElapsedSeconds(elapsed);
      fetch("/api/puzzle/play-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puzzleId, event: "pause" }),
        credentials: "include",
      }).catch(() => {});
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendPauseFetch();
      } else {
        const elapsed = lastPausedElapsedRef.current;
        if (elapsed != null) {
          setStartTime(Date.now() - elapsed * 1000);
          lastPausedElapsedRef.current = null;
          setPausedElapsedSeconds(null);
        }
        fetch("/api/puzzle/play-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ puzzleId, event: "resume" }),
          credentials: "include",
        }).catch(() => {});
        fetchPuzzle();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", sendPause);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", sendPause);
    };
  }, [isDemoMode, isTestPuzzle, puzzle?.puzzleId, isGameOver, startTime]);

  useEffect(() => {
    return () => {
      const state = pauseStateRef.current;
      if (state && !document.hidden) {
        const body = JSON.stringify({ puzzleId: state.puzzleId, event: "pause" });
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/puzzle/play-session", blob);
      }
    };
  }, []);

  // Send "start" when game loads (in-progress, real puzzle)
  useEffect(() => {
    if (
      isDemoMode ||
      isTestPuzzle ||
      !puzzle?.puzzleId ||
      ["demo-puzzle", "demo3-puzzle", "demo5-puzzle", "demo-flop-puzzle"].includes(puzzle.puzzleId) ||
      isGameOver
    )
      return;
    fetch("/api/puzzle/play-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ puzzleId: puzzle.puzzleId, event: "start" }),
      credentials: "include",
    }).catch(() => {});
  }, [isDemoMode, isTestPuzzle, puzzle?.puzzleId, isGameOver]);

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

  const total = Object.values(guesses).reduce((a, b) => a + (b ?? 0), 0);
  const attemptNumber = puzzle?.userGuess
    ? puzzle.userGuess.guessesUsed + 1
    : 1;

  // Per-hand min/max from feedback: low -> min=x, high -> max=x, exact -> min=max=x
  const handBounds = useMemo(() => {
    const bounds: Record<number, { min: number; max: number }> = {};
    for (const h of puzzle?.hands ?? []) {
      bounds[h.position] = { min: 0, max: 100 };
    }
    for (const attempt of puzzle?.userGuess?.guessHistory ?? []) {
      for (const g of attempt.guesses) {
        const b = bounds[g.position] ?? { min: 0, max: 100 };
        if (g.feedback === "low") b.min = Math.max(b.min, g.percent);
        else if (g.feedback === "high") b.max = Math.min(b.max, g.percent);
        else if (g.feedback === "exact") {
          b.min = g.percent;
          b.max = g.percent;
        }
        bounds[g.position] = b;
      }
    }
    return bounds;
  }, [puzzle?.hands, puzzle?.userGuess?.guessHistory]);

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
        <p className="text-gray-600 dark:text-gray-400">Loading puzzle...</p>
      </main>
    );
  }

  if (error) {
    const isPuzzleComing = error === "No puzzle for today" || error?.includes("Today's puzzle is coming up shortly");
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        {isPuzzleComing ? (
          <>
            <p className="text-xl sm:text-2xl font-semibold text-[#1a1a1b] dark:text-gray-100 mb-2">
              Today&apos;s puzzle is coming up shortly!
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
              Check back in a moment. Our daily puzzle will be ready soon.
            </p>
          </>
        ) : (
          <>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
              Make sure you have a puzzle for today. Run the puzzle generation script
              to create puzzles.
            </p>
          </>
        )}
        <Link href="/" className="mt-4 text-gray-600 dark:text-gray-400 hover:text-[#1a1a1b] dark:hover:text-gray-100 text-sm">
          ← Back
        </Link>
      </main>
    );
  }

  if (!puzzle) {
    return null;
  }

  const hasFlop = !!puzzle.flop;

  return (
    <div className="flex justify-center items-center w-full flex-1 min-h-0 flex flex-col">
      <main className={`flex-1 flex flex-col min-h-0 p-2 sm:p-4 w-full gap-0 ${
        puzzle.hands.length === 5 ? 'max-w-full' : 'max-w-[96vw]'
      }`}>
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-sm shadow-xl">
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#1a1a1b] dark:text-gray-100 mb-2 sm:mb-3">
              How to Play
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">
              Guess the {hasFlop ? "post-flop" : "pre-flop"} win percentages for 4 poker hands. Your guesses
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 max-w-sm shadow-xl">
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#1a1a1b] dark:text-gray-100 mb-2 sm:mb-3">
              Understanding Feedback
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
              Each hand gets color-coded feedback based on your guess:
            </p>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
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

      <header className="flex flex-col gap-0.5 mb-3 sm:mb-6 shrink-0">
        <div className="flex justify-between items-center min-h-9 sm:min-h-11">
          <Link href="/" className="text-base sm:text-lg lg:text-2xl font-bold text-[#1a1a1b] dark:text-gray-100 py-1 -my-1 sm:py-2 sm:-my-2 min-h-[36px] sm:min-h-[44px] flex items-center">
            🃏 Hold&apos;emle 🃏
          </Link>
          <span className="text-xs sm:text-base lg:text-xl text-gray-600 dark:text-gray-400 mr-14">
          {isDemoMode ? (
            <span className="bg-[#85c0f9]/20 text-[#85c0f9] px-2 py-0.5 rounded font-medium">
              Demo
            </span>
          ) : (
            <>Puzzle date: {new Date(puzzle.date).toLocaleDateString()}</>
          )}
          </span>
        </div>
        {puzzle.nickname && !isDemoMode && (
          <p className="text-xs sm:text-base lg:text-xl text-gray-600 dark:text-gray-400">Hello, {puzzle.nickname}</p>
        )}
      </header>

      <div className="game-main-content flex flex-col flex-1 min-h-0">
      {isGameOver && puzzle.userGuess ? (
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <ResultsDisplay
            guessHistory={puzzle.userGuess.guessHistory}
            hands={puzzle.hands}
            flop={puzzle.flop}
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
              className="flex-1 min-h-[36px] sm:min-h-[44px] lg:min-h-[52px] py-1.5 sm:py-2 lg:py-3 text-sm sm:text-base lg:text-xl font-medium px-3 sm:px-4 rounded-lg border border-[#d3d6da] dark:border-gray-600 hover:bg-[#e8e9eb] dark:hover:bg-gray-600 text-[#1a1a1b] dark:text-gray-100"
            />
            {isDemoMode && (
              <div className="flex-1 flex flex-col gap-2">
                <Link
                  href="/game"
                  className="min-h-[36px] sm:min-h-[44px] lg:min-h-[52px] py-1.5 sm:py-2 lg:py-3 text-sm sm:text-base lg:text-xl font-medium px-3 sm:px-4 bg-[#6aaa64] text-white rounded-lg hover:bg-[#5a9a54] transition-colors [touch-action:manipulation] flex items-center justify-center"
                >
                  Play for Real
                </Link>
                <p className="text-center text-xs sm:text-base lg:text-lg text-gray-500 dark:text-gray-400">
                  Sign up to play daily puzzles and save your scores
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <div className="mb-1 sm:mb-2 flex justify-between items-center text-xs sm:text-base lg:text-xl text-[#1a1a1b] dark:text-gray-200 pr-14">
            <span>Guess {attemptNumber} of {MAX_GUESSES}</span>
            <Timer startTime={startTime} pausedSeconds={pausedElapsedSeconds} className="font-mono text-xs sm:text-base lg:text-xl" />
          </div>

          <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-4 flex flex-col items-center w-full">
            <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-1">
              Guess each hand&apos;s {hasFlop ? "post-flop" : "preflop"} equity (%)
            </p>
            {hasFlop && (
              <div className="flex items-center justify-center w-full">
                <div className="flex-1 min-w-0 max-w-[280px] sm:max-w-[360px] rounded-lg border bg-[#f6f7f8] dark:bg-gray-700 border-[#d3d6da] dark:border-gray-600 p-2 sm:p-3 lg:p-4 flex items-center justify-center gap-1 sm:gap-2 lg:gap-3">
                  <FlopDisplay flop={puzzle.flop!} />
                </div>
              </div>
            )}
            {puzzle.hands.map((hand) => {
              const { min: handMin, max: handMax } = handBounds[hand.position] ?? { min: 0, max: 100 };
              const v = guesses[hand.position] ?? handMin;
              const canDecrease = v > handMin;
              const canIncrease = v < handMax;
              return (
              <div key={hand.position} className="flex items-center gap-1.5 sm:gap-3 justify-center w-full">
                <div className="flex-1 min-w-0 max-w-[280px] sm:max-w-[360px]">
                  <PokerHand
                    cards={hand.cards}
                    showPercent={false}
                    size="large"
                  />
                </div>
                <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                  <button
                    type="button"
                    disabled={!canDecrease}
                    onClick={() => {
                      if (!canDecrease) return;
                      setGuesses((g) => ({
                        ...g,
                        [hand.position]: Math.max(handMin, (g[hand.position] ?? handMin) - 1),
                      }));
                    }}
                    className="p-0.5 sm:p-1 w-14 sm:w-20 lg:w-24 min-h-[36px] sm:min-h-[44px] lg:min-h-[52px] flex items-center justify-center border border-[#d3d6da] dark:border-gray-600 rounded-l bg-[#f6f7f8] dark:bg-gray-700 hover:bg-[#e8e9eb] dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#f6f7f8] disabled:dark:hover:bg-gray-700 text-lg sm:text-xl [touch-action:manipulation] text-[#1a1a1b] dark:text-gray-100"
                    aria-label="Decrease by 1"
                  >
                    ↓
                  </button>
                  <input
                    type="number"
                    min={handMin}
                    max={handMax}
                    value={guesses[hand.position] ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setGuesses((g) => {
                          const next = { ...g };
                          delete next[hand.position];
                          return next;
                        });
                        return;
                      }
                      const val = parseInt(raw, 10);
                      if (!isNaN(val)) {
                        setGuesses((g) => ({ ...g, [hand.position]: val }));
                      }
                    }}
                    onBlur={() => {
                      const val = guesses[hand.position];
                      if (val === undefined || val < handMin || val > handMax) {
                        const clamped = val === undefined || val < handMin ? handMin : handMax;
                        setGuesses((g) => ({ ...g, [hand.position]: clamped }));
                      }
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    className="w-14 sm:w-20 lg:w-24 min-h-[36px] sm:min-h-[44px] lg:min-h-[52px] px-1 sm:px-2 py-1 sm:py-2 text-sm sm:text-base lg:text-xl border-y border-[#d3d6da] dark:border-gray-600 border-x-0 font-semibold [touch-action:manipulation] text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-white dark:bg-gray-700 text-[#1a1a1b] dark:text-gray-100"
                  />
                  <button
                    type="button"
                    disabled={!canIncrease}
                    onClick={() => {
                      if (!canIncrease) return;
                      setGuesses((g) => ({
                        ...g,
                        [hand.position]: Math.min(handMax, (g[hand.position] ?? handMin) + 1),
                      }));
                    }}
                    className="p-0.5 sm:p-1 w-14 sm:w-20 lg:w-24 min-h-[36px] sm:min-h-[44px] lg:min-h-[52px] flex items-center justify-center border border-[#d3d6da] dark:border-gray-600 rounded-r bg-[#f6f7f8] dark:bg-gray-700 hover:bg-[#e8e9eb] dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#f6f7f8] disabled:dark:hover:bg-gray-700 text-lg sm:text-xl [touch-action:manipulation] text-[#1a1a1b] dark:text-gray-100"
                    aria-label="Increase by 1"
                  >
                    ↑
                  </button>
                  <span className="text-sm sm:text-base lg:text-xl text-[#1a1a1b] dark:text-gray-200">%</span>
                </div>
              </div>
            );})}
          </div>

          <p
            className={`text-xs sm:text-base lg:text-xl mb-1 sm:mb-2 ${
              total === 100 ? "text-[#6aaa64]" : "text-gray-600 dark:text-gray-400"
            }`}
          >
            Total: {total}% (must equal 100%)
          </p>

          {submitError && (
            <p className="text-red-600 text-xs sm:text-base lg:text-lg mb-2">{submitError}</p>
          )}

          <div className="mt-2 sm:mt-4">
            <button
              onClick={handleSubmit}
              disabled={total !== 100 || submitting}
              className="w-full min-h-[36px] sm:min-h-[40px] py-1.5 sm:py-2 text-sm sm:text-base lg:text-lg bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] disabled:opacity-50 disabled:cursor-not-allowed transition-colors [touch-action:manipulation] shrink-0"
            >
              {submitting ? "Submitting..." : "Submit Guess"}
            </button>
            {puzzle.userGuess?.guessHistory && puzzle.userGuess.guessHistory.length > 0 && (
            <div className="mt-2 sm:mt-3">
              <p className="text-xs sm:text-base lg:text-xl font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">
                Previous Guesses:
              </p>
              <div className="space-y-2 sm:space-y-3">
                {[...puzzle.userGuess.guessHistory].reverse().map((attempt) => {
                  const byPosition = [...attempt.guesses].sort(
                    (a, b) => a.position - b.position
                  );
                  return (
                    <div key={attempt.attempt} className="flex flex-col gap-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                        Guess {attempt.attempt}:
                      </p>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {byPosition.map((g) => {
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
                              handCount={puzzle.hands.length}
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
      </div>

      <nav className="mt-auto pt-4 sm:pt-6 flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-base lg:text-xl shrink-0">
        <Link href="/leaderboard" className="text-[#6aaa64] dark:text-[#7dbb77] hover:underline py-1 sm:py-2 min-h-[32px] sm:min-h-[44px] flex items-center">
          Leaderboard
        </Link>
        {!isDemoMode && (
          <Link href="/stats" className="text-[#6aaa64] dark:text-[#7dbb77] hover:underline py-1 sm:py-2 min-h-[32px] sm:min-h-[44px] flex items-center">
            Stats
          </Link>
        )}
        <Link href="/how-to-play" className="text-[#6aaa64] dark:text-[#7dbb77] hover:underline py-1 sm:py-2 min-h-[32px] sm:min-h-[44px] flex items-center">
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
          <p className="text-gray-600 dark:text-gray-400">Loading puzzle...</p>
        </main>
      }
    >
      <GameContent />
    </Suspense>
  );
}
