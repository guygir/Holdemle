# Submit Security Hardening – TODO & Test Plan

**Goal:** Prevent attackers from faking attempt count and time via request tampering (e.g. Burp Suite).

**Scope:**
1. **Attempt number** – derive from DB, never trust client
2. **Time** – event-based play sessions (start/pause/resume); server computes elapsed from its own timestamps

---

## Part A: Attempt Number (Required)

### A1. Database / Server Logic
- [x] **A1.1** In `app/api/puzzle/submit/route.ts`:
  - Derive `guessesUsed = previousHistory.length + 1` from `existingGuess?.guess_history`
  - Remove use of client `attemptNumber` for `guessesUsed` (keep for validation only, see A1.2)
- [x] **A1.2** Validate client `attemptNumber` (if still sent): reject with 400 if `attemptNumber !== guessesUsed`
- [x] **A1.3** Use derived `guessesUsed` for: `guess_history` (attempt field), `guesses_used`, `total_score`, `updateUserStats`

### A2. Client
- [x] **A2.1** Client keeps sending `attemptNumber` (server validates and rejects mismatch)

### A3. Demo Mode
- [x] **A3.1** Demo puzzle (`puzzleId === "demo-puzzle"`) has no DB; keep `attemptNumber` from client for demo only

---

## Part B: Time + Play Sessions (Required)

### B1. Database
- [x] **B1.1** Migration `supabase/migrations/015_play_sessions.sql`:
  - `puzzle_play_sessions` table: `user_id`, `puzzle_id`, `started_at`, `paused_at`, `total_pause_seconds`
  - Drops old `puzzle_timer_ticks` (013/014)

### B2. Play Session API
- [x] **B2.1** `app/api/puzzle/play-session/route.ts`:
  - POST, body: `{ puzzleId, event: "start" | "pause" | "resume" }`
  - Auth required
  - **start:** insert session with `started_at = now()`; if exists and paused, treat as implicit resume
  - **pause:** set `paused_at = now()`
  - **resume:** add `(now - paused_at)` to `total_pause_seconds`, clear `paused_at`

### B3. Client – Send Events
- [x] **B3.1** On game load: send `event: "start"`
- [x] **B3.2** On tab hidden (`visibilitychange`): send `event: "pause"` via fetch
- [x] **B3.3** On tab close (`pagehide`): send `event: "pause"` via `navigator.sendBeacon`
- [x] **B3.4** On tab visible: send `event: "resume"`, then fetch puzzle

### B4. Submit API – Server-Computed Time
- [x] **B4.1** Fetch `puzzle_play_sessions` for user + puzzle
- [x] **B4.2** If session exists: `elapsed = now - started_at - total_pause_seconds` (include current pause if `paused_at` set)
- [x] **B4.3** Use server-computed time for score; ignore client `timeInSeconds` when session exists
- [x] **B4.4** Fallback: if no session, use client time with cap [0, 24h]
- [x] **B4.5** After submit: delete play session row

### B5. Edge Cases
- [x] **B5.1** Missed pause (tab closed abruptly): sendBeacon on pagehide improves delivery
- [x] **B5.2** Resume without prior pause: "start" on reload treats existing paused session as implicit resume

---

## Part C: Request Shape
- **Skipped** – no changes needed.

---

## Part D: Tests

### D1. Unit Tests (New)
- [ ] **D1.1** `app/api/puzzle/submit/route.ts`:
  - Mock: derive `guessesUsed` from `previousHistory.length + 1` when `existingGuess` has 2 attempts → `guessesUsed = 3`
  - Mock: reject when client sends `attemptNumber` that doesn't match derived
- [ ] **D1.2** Play session time computation:
  - Mock session with started_at, total_pause_seconds → correct elapsed
  - Mock session with paused_at → include current pause in elapsed

### D2. Integration / E2E Tests (Manual)
- **See `docs/SUBMIT_SECURITY_MANUAL_TESTS.md`** for a full step-by-step guide.
- Use a test account; remove its plays afterward to avoid affecting leaderboards.
- [ ] **D2.1** **Happy path – first guess solve:**
  1. Load game, solve in 1 guess in ~30 seconds
  2. Verify: ticks sent at 10, 20, 30
  3. Verify: submit succeeds, correct score and time

- [ ] **D2.2** **Happy path – solve in 4 guesses:**
  1. Load game, make 3 wrong guesses, 4th correct
  2. Verify: ticks sent every 10 sec of active play
  3. Verify: submit succeeds, correct guesses used

- [ ] **D2.3** **Pause:**
  1. Load game, play 25 sec, switch tab (pause)
  2. Wait 2 min, return
  3. Play 15 more sec, submit
  4. Verify: total time ~40 sec (not 2m40s), ticks only for active play

- [ ] **D2.4** **Fallback – no play session:**
  1. Disable play-session events
  2. Submit with valid time
  3. Verify: submit succeeds (client time with cap)

- [ ] **D2.5** **Attack – fake attempt number:**
  1. Intercept submit, change `attemptNumber` from 4 to 1
  2. Verify: server rejects with 400

- [ ] **D2.6** **Attack – fake time:**
  1. Play for 2+ minutes, intercept submit
  2. Change `timeInSeconds` to 0
  3. Verify: server ignores client time; uses session-computed time (correct score)

### D3. Regression
- [x] **D3.1** Run existing tests: `npm test` – passed
- [x] **D3.2** Run build: `npm run build` – passed
- [ ] **D3.3** Demo mode: Try Demo flow still works (no auth, no ticks) – manual

---

## Part E: Cleanup & Docs

- [ ] **E1** Update `TODO.md` or similar if this doc is referenced
- [x] **E2** Add migration to deployment checklist
- [x] **E3** Delete attacker's guess + user_stats (manual SQL, one-time) – **done**

---

## Implementation Order

1. **Part A** (Attempt number) – smaller, no new tables
2. **Part B** (Play sessions) – migration, API, client, submit
3. **Part D** (Tests) – throughout

---

## Files

| File | Purpose |
|------|---------|
| `supabase/migrations/015_play_sessions.sql` | puzzle_play_sessions table |
| `app/api/puzzle/play-session/route.ts` | start/pause/resume events |
| `app/api/puzzle/submit/route.ts` | server-computed time |
| `app/api/puzzle/daily/route.ts` | sessionElapsedSeconds for timer restore |
| `app/game/page.tsx` | start/pause/resume + sendBeacon |
