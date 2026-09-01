import type { SupabaseClient } from "@supabase/supabase-js";

export type MentionHand = {
  position: number;
  cards: [string, string];
  percent: number;
};

export type HonorableMention = {
  nickname: string;
  date: string;
  submittedAt: string;
  flop: [string, string, string] | null;
  hands: MentionHand[];
};

export type HonorableMentionsPayload = {
  mentions: HonorableMention[];
  lastMonthUserCount: number;
  lastMonthSolveCount: number;
};

type PuzzleHands = Array<{
  position: number;
  cards?: unknown;
  actualPercent?: number;
}>;

type GuessHistoryAttempt = {
  guesses?: Array<{ position: number; percent: number }>;
};

function asCardPair(cards: unknown): [string, string] | null {
  if (!Array.isArray(cards) || cards.length < 2) return null;
  const a = cards[0];
  const b = cards[1];
  if (typeof a !== "string" || typeof b !== "string") return null;
  return [a, b];
}

function asFlop(flop: unknown): [string, string, string] | null {
  if (!Array.isArray(flop) || flop.length !== 3) return null;
  if (!flop.every((c) => typeof c === "string")) return null;
  return flop as [string, string, string];
}

export function guessedPercentsByPosition(guessHistory: unknown): Map<number, number> {
  const map = new Map<number, number>();
  if (!Array.isArray(guessHistory) || guessHistory.length === 0) return map;
  const first = guessHistory[0] as GuessHistoryAttempt;
  for (const g of first?.guesses ?? []) {
    if (typeof g?.position === "number" && typeof g?.percent === "number") {
      map.set(g.position, g.percent);
    }
  }
  return map;
}

export function buildHonorableMention(input: {
  nickname: string;
  puzzleDate: string;
  submittedAt: string;
  hands: unknown;
  flop?: unknown;
  guessHistory?: unknown;
}): HonorableMention | null {
  if (!Array.isArray(input.hands) || input.hands.length === 0) return null;
  const guessed = guessedPercentsByPosition(input.guessHistory);
  const hands: MentionHand[] = [];
  for (const raw of input.hands as PuzzleHands) {
    const cards = asCardPair(raw.cards);
    if (!cards) return null;
    const percent = guessed.get(raw.position) ?? raw.actualPercent;
    if (typeof percent !== "number" || Number.isNaN(percent)) return null;
    hands.push({
      position: raw.position,
      cards,
      percent,
    });
  }
  hands.sort((a, b) => a.position - b.position);
  return {
    nickname: input.nickname || "Player",
    date: input.puzzleDate,
    submittedAt: input.submittedAt,
    flop: asFlop(input.flop),
    hands,
  };
}

export function monthAgoDateUtc(now = new Date()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - 30);
  return d.toISOString().split("T")[0];
}

export function formatMentionDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

type GuessRow = {
  user_id: string;
  submitted_at: string;
  guess_history: unknown;
  puzzle_id: string;
};

type PuzzleRow = {
  id: string;
  puzzle_date: string;
  hands: unknown;
  flop?: unknown;
};

/**
 * Last N first-guess solves, plus unique-user / solve counts over the past 30 UTC days.
 */
export async function fetchHonorableMentions(
  admin: SupabaseClient,
  options?: { limit?: number; now?: Date }
): Promise<HonorableMentionsPayload> {
  const limit = options?.limit ?? 3;
  const since = monthAgoDateUtc(options?.now);

  const guesses: GuessRow[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data: guessRows, error: guessError } = await admin
      .from("guesses")
      .select("user_id, submitted_at, guess_history, puzzle_id")
      .eq("is_solved", true)
      .eq("guesses_used", 1)
      .order("submitted_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (guessError) {
      console.error("Honorable mentions guesses fetch error:", guessError);
      if (from === 0) {
        return { mentions: [], lastMonthUserCount: 0, lastMonthSolveCount: 0 };
      }
      break;
    }
    if (!guessRows?.length) break;
    guesses.push(...(guessRows as GuessRow[]));
    if (guessRows.length < pageSize) break;
  }
  const puzzleIds = [...new Set(guesses.map((g) => g.puzzle_id).filter(Boolean))];

  const puzzleMap = new Map<string, PuzzleRow>();
  const chunkSize = 100;
  for (let i = 0; i < puzzleIds.length; i += chunkSize) {
    const slice = puzzleIds.slice(i, i + chunkSize);
    const { data: puzzles, error: puzzleError } = await admin
      .from("puzzles")
      .select("id, puzzle_date, hands, flop")
      .in("id", slice);
    if (puzzleError) {
      console.error("Honorable mentions puzzles fetch error:", puzzleError);
      continue;
    }
    for (const p of (puzzles ?? []) as PuzzleRow[]) {
      puzzleMap.set(p.id, p);
    }
  }

  const monthUserIds = new Set<string>();
  let lastMonthSolveCount = 0;
  for (const g of guesses) {
    const puzzle = puzzleMap.get(g.puzzle_id);
    const day = puzzle?.puzzle_date ?? g.submitted_at.slice(0, 10);
    if (day >= since) {
      lastMonthSolveCount += 1;
      monthUserIds.add(g.user_id);
    }
  }

  const top = guesses.slice(0, limit);
  const userIds = [...new Set(top.map((g) => g.user_id))];
  const profileMap = new Map<string, string>();
  if (userIds.length) {
    const { data: profiles, error: profileError } = await admin
      .from("profiles")
      .select("user_id, nickname")
      .in("user_id", userIds);
    if (profileError) {
      console.error("Honorable mentions profiles fetch error:", profileError);
    }
    for (const p of profiles ?? []) {
      profileMap.set(p.user_id, p.nickname);
    }
  }

  const mentions: HonorableMention[] = [];
  for (const g of top) {
    const puzzle = puzzleMap.get(g.puzzle_id);
    if (!puzzle) continue;
    const mention = buildHonorableMention({
      nickname:
        profileMap.get(g.user_id) ?? `Player ${g.user_id.slice(0, 8)}`,
      puzzleDate: puzzle.puzzle_date,
      submittedAt: g.submitted_at,
      hands: puzzle.hands,
      flop: puzzle.flop,
      guessHistory: g.guess_history,
    });
    if (mention) mentions.push(mention);
  }

  return {
    mentions,
    lastMonthUserCount: monthUserIds.size,
    lastMonthSolveCount,
  };
}
