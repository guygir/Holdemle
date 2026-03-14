/**
 * Configurable puzzle generation settings.
 * Puzzle type distribution: % for 3-hand, 4-hand, 5-hand (preflop), and 4-hand post-flop.
 *
 * Env: PUZZLE_TYPE_DISTRIBUTION - JSON, e.g. '{"3":25,"4":35,"5":15,"4flop":25}'
 * Must sum to 100. Defaults: 25% 3-hand, 35% 4-hand, 15% 5-hand, 25% 4-hand post-flop.
 */

export type PuzzleType = "3" | "4" | "5" | "4flop";

export const DEFAULT_PUZZLE_TYPE_DISTRIBUTION: Record<PuzzleType, number> = {
  "3": 25,
  "4": 35,
  "5": 15,
  "4flop": 25,
};

export type HandCount = 3 | 4 | 5;

/** @deprecated Use getPuzzleTypeDistribution. Preflop-only for backward compat. */
export const DEFAULT_HAND_COUNT_DISTRIBUTION: Record<HandCount, number> = {
  3: 25,
  4: 35,
  5: 15,
};

function parsePuzzleTypeDistribution(): Record<PuzzleType, number> {
  const raw = process.env.PUZZLE_TYPE_DISTRIBUTION;
  if (!raw) return { ...DEFAULT_PUZZLE_TYPE_DISTRIBUTION };
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    const result: Record<PuzzleType, number> = {
      "3": parsed["3"] ?? DEFAULT_PUZZLE_TYPE_DISTRIBUTION["3"],
      "4": parsed["4"] ?? DEFAULT_PUZZLE_TYPE_DISTRIBUTION["4"],
      "5": parsed["5"] ?? DEFAULT_PUZZLE_TYPE_DISTRIBUTION["5"],
      "4flop": parsed["4flop"] ?? DEFAULT_PUZZLE_TYPE_DISTRIBUTION["4flop"],
    };
    const sum = result["3"] + result["4"] + result["5"] + result["4flop"];
    if (Math.abs(sum - 100) > 0.01) {
      console.warn(
        `PUZZLE_TYPE_DISTRIBUTION sums to ${sum}, expected 100. Using defaults.`
      );
      return { ...DEFAULT_PUZZLE_TYPE_DISTRIBUTION };
    }
    return result;
  } catch {
    return { ...DEFAULT_PUZZLE_TYPE_DISTRIBUTION };
  }
}

let cached: Record<PuzzleType, number> | null = null;

export function getPuzzleTypeDistribution(): Record<PuzzleType, number> {
  if (!cached) cached = parsePuzzleTypeDistribution();
  return cached;
}

/** Preflop distribution (3, 4, 5) for display - excludes 4flop. */
export function getHandCountDistribution(): Record<HandCount, number> {
  const d = getPuzzleTypeDistribution();
  return { 3: d["3"], 4: d["4"], 5: d["5"] };
}

/** Reset cache (for tests when changing env). */
export function resetHandCountDistributionCache(): void {
  cached = null;
}

/**
 * Sample puzzle type from a value in [0, 100). For deterministic testing.
 */
export function samplePuzzleTypeFromValue(
  r: number,
  dist?: Record<PuzzleType, number>
): PuzzleType {
  const d = dist ?? getPuzzleTypeDistribution();
  if (r < d["3"]) return "3";
  if (r < d["3"] + d["4"]) return "4";
  if (r < d["3"] + d["4"] + d["5"]) return "5";
  return "4flop";
}

/**
 * Sample puzzle type (3, 4, 5 preflop or 4flop post-flop).
 */
export function samplePuzzleType(): PuzzleType {
  return samplePuzzleTypeFromValue(Math.random() * 100);
}

/** @deprecated Use samplePuzzleType. Returns 3|4|5 for preflop types. */
export function sampleHandCount(): HandCount {
  const t = samplePuzzleType();
  if (t === "4flop") return 4;
  return parseInt(t, 10) as HandCount;
}
