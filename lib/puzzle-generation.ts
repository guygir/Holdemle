/**
 * Configurable puzzle generation settings.
 * Hand count distribution: % chance for 3, 4, or 5 hands.
 *
 * Env: HAND_COUNT_DISTRIBUTION - JSON object, e.g. '{"3":25,"4":60,"5":15}'
 * Must sum to 100. Defaults: 3-hand 25%, 4-hand 60%, 5-hand 15%.
 */

export const DEFAULT_HAND_COUNT_DISTRIBUTION: Record<3 | 4 | 5, number> = {
  3: 25,
  4: 60,
  5: 15,
}; // 15% 5-hand, 25% 3-hand, 60% 4-hand

export type HandCount = 3 | 4 | 5;

function parseDistribution(): Record<HandCount, number> {
  const raw = process.env.HAND_COUNT_DISTRIBUTION;
  if (!raw) return { ...DEFAULT_HAND_COUNT_DISTRIBUTION };
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    const result: Record<HandCount, number> = {
      3: parsed["3"] ?? DEFAULT_HAND_COUNT_DISTRIBUTION[3],
      4: parsed["4"] ?? DEFAULT_HAND_COUNT_DISTRIBUTION[4],
      5: parsed["5"] ?? DEFAULT_HAND_COUNT_DISTRIBUTION[5],
    };
    const sum = result[3] + result[4] + result[5];
    if (Math.abs(sum - 100) > 0.01) {
      console.warn(
        `HAND_COUNT_DISTRIBUTION sums to ${sum}, expected 100. Using defaults.`
      );
      return { ...DEFAULT_HAND_COUNT_DISTRIBUTION };
    }
    return result;
  } catch {
    return { ...DEFAULT_HAND_COUNT_DISTRIBUTION };
  }
}

let cached: Record<HandCount, number> | null = null;

export function getHandCountDistribution(): Record<HandCount, number> {
  if (!cached) cached = parseDistribution();
  return cached;
}

/** Reset cache (for tests when changing env). */
export function resetHandCountDistributionCache(): void {
  cached = null;
}

/**
 * Sample hand count from a value in [0, 100). For deterministic testing.
 */
export function sampleHandCountFromValue(
  r: number,
  dist?: Record<HandCount, number>
): HandCount {
  const d = dist ?? getHandCountDistribution();
  if (r < d[3]) return 3;
  if (r < d[3] + d[4]) return 4;
  return 5;
}

/**
 * Sample hand count (3, 4, or 5) according to the configured distribution.
 */
export function sampleHandCount(): HandCount {
  return sampleHandCountFromValue(Math.random() * 100);
}
