# 🃏 Poker Wordle

A daily poker puzzle game inspired by Wordle. Guess the pre-flop winning percentages of 4 poker hands!

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run in demo mode (no Supabase needed)

```bash
npm run dev
```

Visit http://localhost:3000. The game runs with a built-in demo puzzle. **Note:** In demo mode, you must be logged in to submit guesses. Create an account or use a Supabase project to persist scores.

### 3. Set up Supabase (for full features)

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create `.env.local`:

```env
# Required for full features (auth, puzzles, leaderboard)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: set to "true" to force demo puzzle (local dev only)
# In production (Vercel), Supabase is required — app fails if missing
NEXT_PUBLIC_USE_DEMO_PUZZLE=true

# For cron job (generate daily puzzle)
CRON_SECRET=your_cron_secret
```

4. Run database migrations in order (Supabase SQL Editor or `npx supabase db push`):
   - `001_initial_schema.sql`
   - `002_leaderboard_metrics.sql` (adds percent_diff)
   - `003_solved_distribution_jsonb.sql` (replaces solved_in_1/2/3 with flexible JSONB)

5. Generate puzzles:

```bash
npx tsx scripts/generate-puzzles.ts
```

To generate 90 days of puzzles:
```bash
PUZZLE_DAYS=90 npx tsx scripts/generate-puzzles.ts
```

**Hand family weights** (optional `HAND_FAMILY_WEIGHTS` JSON for puzzle variety):
```bash
# Custom weights - families: all_ax, k4s_k6o, q6s_q8o, j8s_j10o, connectors, suited_one_gappers, pocket_pairs, random
HAND_FAMILY_WEIGHTS='{"pocket_pairs":25,"connectors":20}' npx tsx scripts/generate-puzzles.ts
```
See `lib/poker/hand-families.ts` for family definitions and defaults.

## Percentages & Accuracy

- **poker-odds-calc** (npm): Primary. Exhaustive enumeration of all 1.08M possible boards → **exact** equity. ~5 sec per puzzle.
- **pokersolver** (npm): Fallback Monte Carlo. Hand evaluation only; we use it when poker-odds-calc isn’t used.
- **Demo puzzle**: Exact values (30/38/17/15). Run `node scripts/calc-demo-odds.mjs` to verify.

## Configuration

- **MAX_GUESSES** (in `lib/game-config.ts`): Default 3. Change here to allow more guesses; stats and leaderboards scale automatically via `solved_distribution` JSONB.

## Features

- **Daily puzzle**: 4 poker hands, guess the win percentages
- **Configurable guesses**: Wordle-style with color feedback (🟢 exact, 🔵 too high, 🟡 too low)
- **Scoring**: Based on guesses used + time bonus
- **Leaderboards**: Daily and all-time
- **User stats**: Streaks, solve rates, history

## Tech Stack

- Next.js 14, TypeScript, Tailwind CSS
- Supabase (Auth, PostgreSQL)
- pokersolver for hand evaluation

## Project Structure

```
poker-wordle/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Poker logic, Supabase, utils
├── scripts/          # Puzzle generation
└── supabase/         # Database migrations
```

## Documentation

See `POKER_WORDLE_COMPLETE_GUIDE.md` and `POKER_WORDLE_QUICK_START.md` in the project root for full documentation.
