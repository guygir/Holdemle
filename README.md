# 🃏 Poker Wordle

A daily poker puzzle game inspired by Wordle. Guess the pre-flop winning percentages of 4 poker hands!

## 📊 Latest Updates

<!-- VERSION_SECTION - Do not edit manually; run `npm run version:sync` to update from lib/version.json -->
- v1.0 - We're live!
<!-- VERSION_SECTION_END -->

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run in demo mode (no Supabase needed)

```bash
npm run dev
```

Visit http://localhost:3000. The game runs with a built-in demo puzzle. You can play and submit without logging in. Create an account and set up Supabase to save scores and play daily puzzles.

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
   - `001_initial_schema.sql` … `011_nickname_unique_error_no_suffix.sql` (run all in `supabase/migrations/`)

5. Daily puzzles: A GitHub Actions workflow runs at 03:30 UTC and creates/replaces today's puzzle. After deploy, manually trigger "Replace Daily Puzzle" once, or wait for the schedule.

   **Optional** — pre-generate many days locally:
   ```bash
   npx tsx scripts/generate-puzzles.ts
   # Or: PUZZLE_DAYS=90 npx tsx scripts/generate-puzzles.ts
   ```
   Hand family weights (optional): `HAND_FAMILY_WEIGHTS='{"pocket_pairs":25}'` — see `lib/poker/hand-families.ts`.

## Percentages & Accuracy

- **Puzzle generation** (cron + script): Uses `pokersolver` with Monte Carlo 1M iterations for equity. Correctly splits ties.
- **Demo puzzle**: Fixed values (30/38/17/15). Run `npm run calc-demo-odds` to verify.

## Configuration

- **MAX_GUESSES** (in `lib/game-config.ts`): Currently 5. Change here to adjust; stats and leaderboards scale via `solved_distribution` JSONB.

## Features

- **Daily puzzle**: 4 poker hands, guess the pre-flop win percentages
- **5 guesses**: Wordle-style with color feedback (🟩 exact, 🟦 too high, 🟧 too low)
- **Scoring**: Based on guesses used + time bonus
- **Leaderboards**: Daily and all-time
- **User stats**: Streaks, solve rates, history
- **Auth**: Nickname + password (no email required)

## Tech Stack

- Next.js 14, TypeScript, Tailwind CSS
- Supabase (Auth, PostgreSQL)
- pokersolver for hand evaluation (Monte Carlo equity)

## Project Structure

```
poker-wordle/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Poker logic, Supabase, utils, version
├── scripts/          # Puzzle generation, version sync
├── supabase/         # Database migrations
└── .github/          # Workflows (daily puzzle cron, tests)
```

## Version Updates

To release a new version:

1. Edit `lib/version.json` — add an entry to `updates` and bump `version` if desired.
2. Commit — the pre-commit hook automatically runs `version:sync` and stages README.md when `lib/version.json` is committed.
3. Push.

CI verifies the sync; if README is out of sync, the build fails.

## Documentation

See `DEPLOYMENT_CHECKLIST.md` for the full deployment guide (Supabase → GitHub → Vercel).
