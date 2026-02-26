# Submit Security – Manual Test Guide

Use a **test account** for these tests. Remove its plays afterward to avoid affecting leaderboards.

**Prerequisites:** Migration 015 applied, dev server running (`npm run dev`). Watch the terminal for `[submit]` logs.

---

## 1. Happy Paths

### 1.1 First guess solve (&lt; 10 seconds)
| Step | Action |
|------|--------|
| 1 | Load game, solve correctly in **under 10 seconds** |
| 2 | Submit |

**Expected:**
- Submit succeeds
- Logs: `attemptNumber: 1`, `guessesUsed: 1`, `match: true`
- Logs: `server-computed time:` or `no play session (fallback)`
- Score and time shown correctly on results screen

---

### 1.2 First guess solve (10–25 seconds)
| Step | Action |
|------|--------|
| 1 | Load game, wait **15–25 seconds**, solve correctly |
| 2 | Submit |

**Expected:**
- Submit succeeds
- Logs: `server-computed time:` with `timeInSecondsFinal` ≈ 15–25
- Score and time shown correctly

---

### 1.3 Solve in 4 guesses
| Step | Action |
|------|--------|
| 1 | Load game, make 3 wrong guesses (any percentages that sum to 100) |
| 2 | Wait at least 10 seconds between some guesses (to generate ticks) |
| 3 | On 4th guess, solve correctly |
| 4 | Submit |

**Expected:**
- Submit succeeds
- Logs: `attemptNumber: 4`, `guessesUsed: 4`, `match: true`
- Server-computed time used for score

---

### 1.4 Solve in 2 guesses
| Step | Action |
|------|--------|
| 1 | Load game, make 1 wrong guess |
| 2 | Submit 2nd guess (correct) |

**Expected:**
- Submit succeeds
- Logs: `attemptNumber: 2`, `guessesUsed: 2`, `match: true`

---

## 2. Pause & Resume

### 2.1 Pause mid-game
| Step | Action |
|------|--------|
| 1 | Load game, play 25 seconds |
| 2 | Switch to another tab for 2 minutes |
| 3 | Return, play 15 more seconds |
| 4 | Submit (correct or wrong) |

**Expected:**
- Submit succeeds
- Total time ≈ 40 seconds (not 2m40s)
- Logs: `timeInSecondsFinal` ≈ 40, `server-computed time`
- Pause/resume events sent; server correctly excludes pause duration

---

### 2.2 Pause before first submit
| Step | Action |
|------|--------|
| 1 | Load game, wait 15 seconds |
| 2 | Switch tab for 1 minute |
| 3 | Return, make first guess and submit |

**Expected:**
- Submit succeeds
- Time ≈ 15 seconds (effective play only)

---

## 3. Time Edge Cases

### 3.1 Fast solve (< 10 seconds)
| Step | Action |
|------|--------|
| 1 | Load game, solve in **under 10 seconds** |
| 2 | Submit |

**Expected:**
- Submit succeeds
- Logs: `server-computed time:` with `timeInSecondsFinal` ≈ 0–10

---

### 3.2 Longer play (~1 minute)
| Step | Action |
|------|--------|
| 1 | Load game, wait **50–55 seconds**, solve |
| 2 | Submit |

**Expected:**
- Submit succeeds
- Logs: `server-computed time:` with `timeInSecondsFinal` ≈ 50–55

---

## 4. Fallback (No Play Session)

### 4.1 No play session
To simulate: temporarily disable play-session events in `app/game/page.tsx`, then run a normal game.

**Expected:**
- Submit succeeds (fallback path)
- Logs: `no play session (fallback), timeInSeconds: X`
- Server uses client time with cap [0, 24h]

---

## 5. Attack Scenarios (Rejection)

### 5.1 Fake attempt number
| Step | Action |
|------|--------|
| 1 | Load game, make 3 wrong guesses |
| 2 | Intercept with Burp/DevTools: change `attemptNumber` from 4 to 1 |
| 3 | Submit |

**Expected:**
- Submit **rejected** with 400
- Error: "Attempt number mismatch"
- Logs: `guessesUsed: 4`, `attemptNumber: 1`, `match: false`

---

### 5.2 Fake time (ignored when session exists)
| Step | Action |
|------|--------|
| 1 | Load game, play 2+ minutes |
| 2 | Intercept: change `timeInSeconds` to 0 |
| 3 | Submit |

**Expected:**
- Submit **succeeds** (server ignores client time)
- Logs: `server-computed time:` with `timeInSecondsFinal` ≈ 120+, `clientReported: 0`
- Score uses correct server time

---

### 5.3 Fake time (too high)
| Step | Action |
|------|--------|
| 1 | Load game, solve in 1 guess in ~20 seconds |
| 2 | Intercept: change `timeInSeconds` to 100 |
| 3 | Submit |

**Expected:**
- Submit **succeeds** (server ignores client time)
- Logs: `timeInSecondsFinal` ≈ 20, `clientReported: 100`

---

### 5.4 Negative time (fallback)
| Step | Action |
|------|--------|
| 1 | Disable play-session events, load game, solve |
| 2 | Intercept: change `timeInSeconds` to -1 |
| 3 | Submit |

**Expected:**
- Submit **rejected** or clamped to 0 (fallback path)

---

## 6. Demo Mode (Unchanged)

### 6.1 Try Demo flow
| Step | Action |
|------|--------|
| 1 | Go to home, click "Try Demo" |
| 2 | Solve in 1 or more guesses |
| 3 | Submit |

**Expected:**
- Submit succeeds
- No auth, no play sessions, no server-side attempt/time validation
- Demo behaves as before

---

## 7. Regression

### 7.1 Full game flow
| Step | Action |
|------|--------|
| 1 | Sign in, play today's puzzle |
| 2 | Complete (win or lose) |
| 3 | Check leaderboard, stats, share |

**Expected:**
- All flows work without errors
- Score and time appear correctly on leaderboard

---

## 8. Log Checklist

For each submit, verify in logs:

| Log | What to check |
|-----|----------------|
| `[submit] request:` | `attemptNumber`, `timeInSeconds`, `guesses` match what you did |
| `[submit] derived:` | `guessesUsed` = `previousHistory.length + 1`, `match: true` |
| `[submit] server-computed time:` | `timeInSecondsFinal` ≈ actual play time; `clientReported` ignored when session exists |

---

## 9. Cleanup After Testing

```sql
-- Remove test user's guesses (replace USER_ID with actual)
DELETE FROM guesses WHERE user_id = 'USER_ID';

-- Reset test user's stats (or delete row)
DELETE FROM user_stats WHERE user_id = 'USER_ID';

-- Clean up any orphaned play sessions
DELETE FROM puzzle_play_sessions WHERE user_id = 'USER_ID';
```
