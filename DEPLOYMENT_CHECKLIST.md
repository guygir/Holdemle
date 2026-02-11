# Deployment Checklist: Supabase → GitHub → Vercel

Order matters. Follow this sequence.

---

## Phase 1: Supabase

### 1.1 Create Supabase project
- Go to [supabase.com](https://supabase.com) → New project
- Pick name, password (for DB), region

### 1.2 Get Supabase credentials
**Where:** Supabase Dashboard → **Project Settings** (gear) → **API**

| Variable | Where to find |
|----------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** (e.g. `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon public** key under "Project API keys" |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** key (same section – *keep secret*) |

### 1.3 Run migrations
**Where:** Supabase Dashboard → **SQL Editor** → New query

Run in order:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_leaderboard_metrics.sql`
3. `supabase/migrations/003_solved_distribution_jsonb.sql`

### 1.4 Generate puzzles (local)
Create `.env.local` in `poker-wordle/`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

Then run:
```bash
cd poker-wordle
npx tsx scripts/generate-puzzles.ts
```

Optional: `PUZZLE_DAYS=90` for more puzzles. Takes ~5 min for 30 days.

---

## Phase 2: GitHub

### 2.1 Push code to GitHub
- Create a new repo on github.com
- Push from `poker-wordle/` (app root with package.json):
  ```bash
  cd poker-wordle
  git init   # if not already a git repo
  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
  git push -u origin main
  ```
  Or, if your repo root is `Cursor_Holdemle/`, set Vercel **Root Directory** to `poker-wordle` in Phase 3.

### 2.2 Create CRON_SECRET
**Pick a random string** (e.g. `openssl rand -hex 32`)

You'll use this in both GitHub and Vercel – same value.

### 2.3 Add GitHub Secrets
**Where:** Repo → **Settings** → **Secrets and variables** → **Actions**

| Name | Value | Purpose |
|------|-------|---------|
| `CRON_SECRET` | Your random secret | Auth for daily-puzzle workflow |

### 2.4 (Optional) Add GitHub Variable
**Where:** Repo → **Settings** → **Secrets and variables** → **Variables**

| Name | Value | Purpose |
|------|-------|---------|
| `POKER_WORDLE_APP_URL` | `https://your-app.vercel.app` | Only after Vercel deploy; default is `https://poker-wordle.vercel.app` |

---

## Phase 3: Vercel

### 3.1 Connect repo to Vercel
- Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
- Import your GitHub repo
- **Root Directory:** `poker-wordle` (if repo root is one level up) or leave as repo root
- **Framework:** Next.js (auto-detected)

### 3.2 Add Vercel env vars
**Where:** Project → **Settings** → **Environment Variables**

Add these for **Production** (and Preview if you want):

| Name | Value | Where you got it |
|------|-------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase API settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Supabase service_role key |
| `CRON_SECRET` | Same value as GitHub secret | You created it in Phase 2 |

Do **not** set `NEXT_PUBLIC_USE_DEMO_PUZZLE` in prod – app uses Supabase.

### 3.3 Deploy
- Click **Deploy** or push to `main`
- Note your app URL: `https://your-project.vercel.app`

---

## Phase 4: Supabase Auth (after Vercel URL)

### 4.1 Add redirect URLs
**Where:** Supabase Dashboard → **Authentication** → **URL Configuration**

Add to **Redirect URLs**:
- `https://your-project.vercel.app/**`
- `https://your-project-*.vercel.app/**` (for preview deployments)

### 4.2 (Optional) Set Site URL
**Where:** Same page

Set **Site URL** to `https://your-project.vercel.app` for auth redirects after login/signup.

---

## Phase 5: GitHub cron (after deploy)

### 5.1 Set POKER_WORDLE_APP_URL (if custom domain)
**Where:** GitHub repo → Settings → Variables

If your Vercel URL is **not** `https://poker-wordle.vercel.app`, add:

| Name | Value |
|------|-------|
| `POKER_WORDLE_APP_URL` | `https://your-actual-app.vercel.app` |

### 5.2 Test cron manually
**Where:** GitHub repo → **Actions** → **Generate Daily Puzzle** → **Run workflow**

Check that it runs and returns success.

---

## Quick reference: env vars by location

| Variable | Supabase | GitHub | Vercel |
|----------|----------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ API | — | ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ API | — | ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ API | — | ✓ |
| `CRON_SECRET` | — | ✓ Secret | ✓ |
| `POKER_WORDLE_APP_URL` | — | ✓ Var (optional) | — |

---

## Troubleshooting

- **503 "Supabase not configured"** → Check Vercel env vars; redeploy after adding.
- **Auth redirect fails** → Add Vercel URL to Supabase redirect URLs.
- **Cron fails** → Ensure `CRON_SECRET` matches in Vercel and GitHub; check `POKER_WORDLE_APP_URL` if not default.
