# Poker Wordle – Development TODO

This document breaks down the 10 main tasks into actionable subtasks. Order is flexible; dependencies are noted.

---

## 1. Share Feature ✓ (implemented)

### Subtasks
- [x] **1.1** ShareButton component on results screen (next to Retry)
- [x] **1.2** Share text formatter: `lib/utils/share-text.ts` – date, guessesUsed/MAX, win/loss, emoji grid (🟩 exact, 🟦 high, 🟨 low)
- [x] **1.3** `navigator.clipboard.writeText()` with `window.prompt` fallback
- [x] **1.4** "Copied!" feedback (2s)
- [ ] **1.5** (Optional) Web Share API on mobile for native share sheet
- [ ] **1.6** (Optional) Twitter/X share link with pre-filled text

---

## 2. Mobile Polish ✓ (implemented)

### Subtasks
- [x] **2.1** Responsive padding p-4 sm:p-6; max-w-lg on all main pages
- [x] **2.2** Touch targets: min-h-[44px] on buttons, links, inputs; [touch-action:manipulation]
- [x] **2.3** Larger inputs: min-h-[44px], text-base, w-14 sm:w-16
- [x] **2.4** Previous guesses: overflow-x-auto, -webkit-overflow-scrolling:touch, snap-x
- [x] **2.5** Header: min-h-11, flex items; nav links min-h-[44px]
- [ ] **2.6** Test on real devices or Chrome DevTools device emulation
- [x] **2.7** Viewport: width=device-width, initialScale=1, maximumScale=5
- [x] **2.8** Keyboard: Enter key submits guess (onKeyDown on inputs)

---

## 3. Supabase Integration (in progress)

Fully use Supabase for auth and data instead of demo mode.

### Subtasks
- [x] **3.1** Document required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_USE_DEMO_PUZZLE`
- [ ] **3.2** Add RLS policy so anyone can read today’s puzzle (fix `CURRENT_DATE` vs UTC if needed)
- [ ] **3.3** Add RLS so leaderboard can read guesses for today’s puzzle (or rely on admin client; document choice)
- [x] **3.4** Ensure `user_stats` upsert runs correctly (insert vs update) – explicit `onConflict: "user_id"`
- [ ] **3.5** Show `auth.users.raw_user_meta_data->>'username'` or email in leaderboard (or add `profiles` table)
- [ ] **3.6** Optional: `profiles` table for display name, avatar, etc.
- [x] **3.7** Gate demo via `NEXT_PUBLIC_USE_DEMO_PUZZLE`; fail fast (503) if Supabase missing in prod – `lib/demo-mode.ts`
- [ ] **3.8** Test full flow: signup → play → submit → leaderboard → stats

---

## 4. Vercel Integration

Deploy and run on Vercel.

### Subtasks
- [ ] **4.1** Connect GitHub repo to Vercel project
- [ ] **4.2** Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`
- [ ] **4.3** Configure redirect URLs in Supabase Auth for Vercel domain (prod + preview)
- [ ] **4.4** Run `vercel build` locally and fix build errors
- [ ] **4.5** Enable automatic deploys on push to main
- [ ] **4.6** (Optional) Custom domain
- [ ] **4.7** Document deployment steps in README

---

## 5. Leaderboard Metrics ✓ (implemented)

### Final decisions
- Daily: Win before Loss. Winners → fewer guesses → less time. Losers → % diff.
- All-time: Wins → avg guesses → avg % diff. Failed games = MAX_GUESSES for avg.
- % diff = sum of |guessed − actual| over 4 hands (final attempt).

### Implementation
- [x] `lib/game-config.ts`: MAX_GUESSES, getBaseScore(); migration 002 for percent_diff
- [x] Daily sort: `sortDailyLeaderboard()`; All-time: wins, avg guesses, avg % diff
- [x] **solved_distribution** JSONB (migration 003): Replaces solved_in_one/two/three. Format `{"1": 5, "2": 3, "3": 2}`. Scales with any MAX_GUESSES. See `lib/utils/solved-distribution.ts`.

---

## 6. Stats Page & Leaderboard Page

Complete and wire up both pages.

### Stats page
- [x] **6.1** Ensure `/api/stats` returns correct data for logged-in users
- [ ] **6.2** Handle unauthenticated users (redirect to login or show “Login to view”)
- [ ] **6.3** Add `user_stats` trigger or API logic so stats update on first guess (currently done in submit)
- [ ] **6.4** Consider: win rate %, games-per-guess distribution chart
- [x] **6.5** Fix: `average_guesses` only counts solved games – `getAverageGuessesFromSolvedDistribution`

### Leaderboard page
- [x] **6.6** Show `time_taken_seconds` or formatted time for daily leaderboard
- [ ] **6.7** Show guesses used (e.g. “2/3”)
- [ ] **6.8** Use real usernames/emails from `profiles` or `auth.users` (see 3.5)
- [ ] **6.9** Highlight current user’s row
- [ ] **6.10** Pagination or “Load more” if > 50 entries
- [ ] **6.11** Empty state for demo mode: “Login and play to see leaderboard”

---

## 7. Configurable Hand Families ✓ (implemented)

### Hand family definitions
- **all_ax** – Any Ace + any other card
- **k4s_k6o** – K4s+ suited, K6o+ offsuit
- **q6s_q8o** – Q6s+ suited, Q8o+ offsuit
- **j8s_j10o** – J8s+ suited, J10o+ offsuit
- **connectors** – Consecutive ranks, any suit combo
- **suited_one_gappers** – Same suit, 1 rank gap (e.g. 9s7s)
- **pocket_pairs** – Same rank, different suits
- **random** – Any two cards

### Subtasks
- [x] **7.1** `lib/poker/hand-families.ts`: HandFamily type, pickHandFromFamily, generateFourHandsWithFamilies
- [x] **7.2** `HAND_FAMILY_WEIGHTS` env (JSON) + `DEFAULT_HAND_FAMILY_WEIGHTS`
- [x] **7.3** pickHandFromFamily(family, exclude)
- [x] **7.4** generateFourHandsWithFamilies(weights):
  - Sample 4 families (with replacement) based on weights
  - For each, pick a hand excluding already-used cards
  - Retry if no valid hand; abort after N attempts
- [x] **7.5** No card overlap (validated in tests)
- [x] **7.6** `generate-puzzles.ts` uses new generator
- [ ] **7.7** Doc in hand-families.ts (e.g. “K4s” = K4 suited) in code/comments

---

## 8. Daily Puzzle Generation + Cron ✓ (implemented)

Auto-generate daily puzzle with correct solution.

### Subtasks
- [x] **8.1** Create `/api/cron/generate-daily-puzzle`:
  - Verify `Authorization: Bearer ${CRON_SECRET}`
  - Generate tomorrow’s puzzle by default; `?date=YYYY-MM-DD` for custom date
  - Uses `generateFourHandsWithFamilies`, `calculatePreFlopOdds`, `roundToSum100`
  - Inserts into `puzzles`; skips if already exists
- [x] **8.2** Create `.github/workflows/daily-puzzle.yml`:
  - Schedule: `0 0 * * *` (midnight UTC)
  - `workflow_dispatch` for manual runs
  - Calls app URL with `CRON_SECRET`; set `POKER_WORDLE_APP_URL` repo variable if needed
- [ ] **8.3** Add `CRON_SECRET` to GitHub Secrets
- [ ] **8.4** Add `CRON_SECRET` to Vercel env
- [ ] **8.5** Optional: generate 1–7 days ahead as buffer; cron tops up
- [ ] **8.6** Fallback: if GET `/api/puzzle/daily` finds no puzzle, optionally trigger on-demand generation (admin-only or rate-limited)
- [ ] **8.7** Log cron runs; consider simple health/status endpoint

---

## 9. Basic Tests (GitHub CI/CD) ✓ (implemented)

### Subtasks
- [x] **9.1** Vitest
- [x] **9.2** `test`, `test:watch`, `test:ci` scripts
- [x] **9.3** Unit tests: scoring, validation, roundToSum100, share-text, solved-distribution
- [ ] **9.4** (Optional) Odds: smoke test `calculatePreFlopOdds`; may be slow
- [ ] **9.5** API route tests:
  - `POST /api/puzzle/submit` with demo puzzle: valid guess, invalid sum, already solved
  - `GET /api/puzzle/daily` returns structure
- [x] **9.6** `.github/workflows/test.yml`: push/PR → npm ci, build, test
  - On push/PR to main
  - `npm ci && npm run build && npm run test`
- [ ] **9.7** Ensure tests pass locally before merging

---

## 10. First-Time UX

Onboarding for new players.

### Subtasks
- [ ] **10.1** Detect first-time visit: `localStorage` flag or cookie (e.g. `poker-wordle-seen-tutorial`)
- [ ] **10.2** Optional: short modal/tooltip on first game load: “Guess the pre-flop odds for 4 hands. Sum must be 100%. 3 guesses!”
- [ ] **10.3** Link “How to Play” clearly on landing and game page
- [ ] **10.4** Optional: interactive tutorial (step-by-step highlight of inputs, submit, feedback)
- [ ] **10.5** Optional: example puzzle or “Practice” mode with known solution
- [ ] **10.6** “Skip” or “Got it” to dismiss and set `poker-wordle-seen-tutorial`
- [ ] **10.7** Ensure How to Play covers feedback colors, scoring, and the 100% rule

---

## Cross-Cutting

### Before/after each task
- [ ] Update README with new env vars, scripts, or flows
- [ ] Remove or limit “Retry (debug)” in production
- [ ] Consider upgrading Next.js from 14.2.x

### Suggested order (by dependency)
1. **5. Leaderboard metrics** – affects scoring and DB
2. **7. Hand families** – needed for **8. Daily puzzle**
3. **8. Daily puzzle + cron** – depends on 7, 3
4. **3. Supabase** – before 4 and 8
5. **4. Vercel** – after 3
6. **6. Stats & Leaderboard** – after 5
7. **1. Share**, **2. Mobile**, **9. Tests**, **10. First-time UX** – can be done in parallel
