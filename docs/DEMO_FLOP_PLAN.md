# Demo Mode: 4-Hand + Flop (demo=flop)

## Overview

Add a new demo mode (`demo=flop`) that:
- Has **4 hands** like the regular game
- Shows the **FLOP** (first 3 community cards) visible to the player
- Calculates **post-flop equity** (odds given the flop is known; turn and river unknown)
- Integrates like `demo=3` and `demo=5` (no auth, same flow)

---

## 1. Odds Calculation: Post-Flop

### Do we have the function?

**No.** The current `lib/poker/odds-calculator.ts` only has:
- `calculatePreFlopOddsExhaustive(hands)` — enumerates all C(44,5) = 1,086,008 boards
- `calculatePreFlopOdds(hands, iterations)` — Monte Carlo

### New function needed

**`calculatePostFlopOddsExhaustive(hands, flop)`**

- **Input:** 4 hands (8 cards) + flop (3 cards)
- **Deck:** 52 - 8 - 3 = **41 cards** remaining
- **Enumerate:** C(41, 2) = **820** turn+river combinations (exact, very fast)
- **Logic:** For each (turn, river), build full board = flop + turn + river, evaluate all 4 hands with `Hand.solve` + `Hand.winners`, accumulate equity
- **Output:** Same as pre-flop — array of percentages summing to 100

**Complexity:** 820 iterations vs 1M+ for Monte Carlo pre-flop. Post-flop is exact and trivial to compute.

---

## 2. File-by-File Implementation Plan

### 2.1 `lib/poker/odds-calculator.ts`

Add:

```ts
/**
 * Calculate post-flop equity for 4 hands given a known flop.
 * Enumerates all C(41,2) = 820 turn+river combinations. Exact equity.
 */
export function calculatePostFlopOddsExhaustive(
  hands: Array<[string, string]>,
  flop: [string, string, string]
): number[]
```

- `usedCards` = hands.flat() + flop
- `deck` = createDeck(usedCards) → 41 cards
- Double loop over (i, j) for turn+river
- For each pair: `board = [...flop, deck[i], deck[j]]`
- Same Hand.solve / Hand.winners logic as pre-flop
- Return equity * 100

---

### 2.2 `scripts/calc-demo-flop-odds.ts` (new file)

- Define 4 hands + flop (pick interesting combo, e.g. flop that changes equities)
- Call `calculatePostFlopOddsExhaustive(hands, flop)`
- Call `roundToSum100(odds)`
- Print results and copy-paste block for `DEMO_FLOP_PUZZLE`
- Run: `npx tsx scripts/calc-demo-flop-odds.ts`

**Example puzzle:**
```ts
const demoFlopHands: [string, string][] = [
  ["As", "Kh"],
  ["Qd", "Qc"],
  ["Jh", "Js"],
  ["9c", "9d"],
];
const demoFlop: [string, string, string] = ["Th", "9h", "2d"]; // example
```

---

### 2.3 `app/api/puzzle/daily/route.ts`

- Add `DEMO_FLOP_PUZZLE` constant with `id: "demo-flop-puzzle"`, `hands`, `flop`, `actualPercent` per hand
- Extend puzzle shape: `flop?: [string, string, string]`
- In GET handler: `if (demoParam === "flop") demoPuzzle = DEMO_FLOP_PUZZLE`
- Return `flop` in response when present

---

### 2.4 `app/api/puzzle/submit/route.ts`

- Add `puzzleId === "demo-flop-puzzle"` branch
- Use `DEMO_FLOP_PUZZLE` hands/actualPercent for validation (same pattern as demo3/demo5)

---

### 2.5 `lib/supabase/middleware.ts`

- Extend: `demoParam === "1" || demoParam === "3" || demoParam === "5" || demoParam === "flop"`

---

### 2.6 `app/page.tsx`

- Add "Try 4-hand + Flop" (or "Demo (4 hands + Flop)") button
- `href="/game?demo=flop"`
- Place alongside demo=3 and demo=5 (e.g. third button in grid, or new row)

---

### 2.7 `app/game/page.tsx`

- **PuzzleData interface:** Add `flop?: [string, string, string]`
- **Fetch:** Already passes `demo=flop` to API; response will include `flop`
- **Layout:** When `puzzle.flop` exists:
  - Render flop row above the 4 hands (e.g. "Flop:" + 3 cards)
  - Use same card styling as PokerHand (reuse card div classes)
- **Copy:** Ensure `isDemoMode` check includes `demoParam === "flop"` (already true since `demoParam !== null`)
- **Tutorial:** Optionally update "pre-flop" → "post-flop" when flop is shown (or keep generic "win percentages")

---

### 2.8 Flop display component

**Option A:** Inline in `game/page.tsx` — a simple div with 3 card tiles, reusing card styling from PokerHand.

**Option B:** New `components/CommunityCards.tsx` — accepts `cards: string[]`, renders them in a row. Reusable for future turn/river if needed.

**Recommendation:** Option A for minimal surface; or a tiny `FlopDisplay` that takes `flop: [string, string, string]` and uses `cardToDisplay` + `getCardColor` from existing libs.

---

### 2.9 `components/ResultsDisplay.tsx`

- Accept optional `flop?: [string, string, string]` in props
- When present, show flop row in "Correct" section and in guess history (so user sees flop on results too)

---

### 2.10 `components/PokerHand.tsx`

- No changes. Card display is already generic.

---

## 3. Data Flow Summary

| Step | demo=3/5 | demo=flop |
|------|-----------|-----------|
| URL | `/game?demo=3` | `/game?demo=flop` |
| API daily | Returns 3 or 5 hands | Returns 4 hands + flop |
| Odds | Pre-flop exhaustive | Post-flop exhaustive |
| Submit | demo3-puzzle / demo5-puzzle | demo-flop-puzzle |
| UI | Hands only | Flop + 4 hands |

---

## 4. Checklist

- [ ] Add `calculatePostFlopOddsExhaustive` to `lib/poker/odds-calculator.ts`
- [ ] Add unit test for post-flop (optional but recommended)
- [ ] Create `scripts/calc-demo-flop-odds.ts`, run it, get DEMO_FLOP_PUZZLE values
- [ ] Add `DEMO_FLOP_PUZZLE` to `app/api/puzzle/daily/route.ts`
- [ ] Add `demo-flop-puzzle` handling to `app/api/puzzle/submit/route.ts`
- [ ] Update `lib/supabase/middleware.ts` for `demo=flop`
- [ ] Add "Try 4-hand + Flop" button to `app/page.tsx`
- [ ] Extend `PuzzleData` and game page to show flop when present
- [ ] Add flop display (inline or `FlopDisplay` component) in game page
- [ ] Add flop display in `ResultsDisplay` when present
- [ ] Update tutorial text for flop mode (optional)
- [ ] Manual test: load `/game?demo=flop`, verify flop visible, submit, verify feedback

---

## 5. Suggested Demo Puzzle

Pick hands and flop that create interesting post-flop dynamics (e.g. flush draw, pair on board):

```ts
// Example - verify with script
hands: [["As", "Kh"], ["Qd", "Qc"], ["Jh", "Js"], ["9c", "9d"]]
flop: ["Th", "9h", "2d"]
// 99 improves, others shift; run script for exact %
```

---

## 6. Files to Create/Modify

| File | Action |
|------|--------|
| `lib/poker/odds-calculator.ts` | Add `calculatePostFlopOddsExhaustive` |
| `scripts/calc-demo-flop-odds.ts` | Create |
| `app/api/puzzle/daily/route.ts` | Add DEMO_FLOP_PUZZLE, demo=flop branch |
| `app/api/puzzle/submit/route.ts` | Add demo-flop-puzzle branch |
| `lib/supabase/middleware.ts` | Allow demo=flop |
| `app/page.tsx` | Add demo=flop button |
| `app/game/page.tsx` | Add flop to PuzzleData, render flop row |
| `components/ResultsDisplay.tsx` | Add optional flop display |
| `lib/poker/odds-calculator.test.ts` | Add post-flop test (optional) |
