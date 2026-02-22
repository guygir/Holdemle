# Daily Plays Chart – Implementation Guide

Quick guide to implement a daily plays line chart in another game. Based on Holdemle's implementation.

---

## Reference Files (Holdemle)

| File | Purpose |
|------|---------|
| `app/api/daily-plays/route.ts` | API: fetches DB → returns `{ launchDate, points }` |
| `components/DailyPlaysChart.tsx` | Client component: fetches API → renders SVG line chart |
| `app/page.tsx` | Renders `<DailyPlaysChart />` on home page |
| `lib/supabase/admin.ts` | Supabase admin client (for API) |
| `lib/demo-mode.ts` | Demo mode check (returns empty when DB not configured) |

**Full paths:**
- `/poker-wordle/app/api/daily-plays/route.ts`
- `/poker-wordle/components/DailyPlaysChart.tsx`
- `/poker-wordle/app/page.tsx`
- `/poker-wordle/lib/supabase/admin.ts`
- `/poker-wordle/lib/demo-mode.ts`

---

## 1. API Route

**Path:** `app/api/daily-plays/route.ts`

**Logic:**
1. `today` = `new Date().toISOString().split("T")[0]` (UTC date string)
2. Load all rows from your **daily entity** table where `date <= today`, ordered by `date` ascending (e.g. `puzzles`, `challenges`, `rounds`)
3. Collect their IDs
4. Count rows in your **plays** table (e.g. `guesses`, `attempts`, `sessions`) where `entity_id IN (those IDs)` and `plays > 0`
5. Map each date to `{ day, date, plays }` where `day` = days since launch (index)
6. Return `{ success: true, data: { launchDate, points } }`
7. Add headers: `Cache-Control: no-store`, `Pragma: no-cache`

**Response shape:**
```json
{
  "success": true,
  "data": {
    "launchDate": "2026-02-12",
    "points": [
      { "day": 0, "date": "2026-02-12", "plays": 5 },
      { "day": 1, "date": "2026-02-13", "plays": 12 },
      { "day": 2, "date": "2026-02-14", "plays": 26 }
    ]
  }
}
```

**Schema assumptions:**
- **Daily table:** `id`, `date` (or equivalent)
- **Plays table:** `entity_id`, `user_id`, `play_count` or `completed` flag (one row per user per entity)

---

## 2. Chart Component

**Path:** `components/DailyPlaysChart.tsx`

- `"use client"` – client component
- `useEffect`: `fetch("/api/daily-plays", { cache: "no-store" })`
- State: `loading`, `data`, handle empty
- SVG line chart: X = days, Y = plays
- Use `polyline` with scaled points: `scaleX(day)`, `scaleY(plays)`
- Y grid lines for ticks; last X label = "Today"
- Sizing: ~340×140px; parent should give it a min height (e.g. 220px)

**Key helpers:**
- `getYTicks(max)` – tick values for Y axis
- `getXTicks(maxDay)` – tick values for X axis
- `scaleX(day)`, `scaleY(plays)` – map data to SVG coords

---

## 3. Page Usage

```tsx
import DailyPlaysChart from "@/components/DailyPlaysChart";

// In your JSX:
<div className="w-full h-[220px] flex justify-center items-center">
  <DailyPlaysChart />
</div>
```

---

## 4. Adapting to Your Game

| Concept | Holdemle | Your game |
|---------|----------|-----------|
| Daily entity | `puzzles` (puzzle_date) | e.g. `challenges`, `levels`, `rounds` |
| Plays table | `guesses` (puzzle_id, guesses_used > 0) | e.g. `attempts`, `sessions`, `scores` |
| "One play" | One row per user per puzzle | One row per user per day/entity |

**Count rule:** Include anyone who started (e.g. `play_count > 0`), not only completions.

---

## 5. Anti-Caching

Use both to avoid stale data:

- **Client fetch:** `fetch(url, { cache: "no-store" })`
- **API response:** `headers: { "Cache-Control": "no-store", "Pragma": "no-cache" }`

---

## 6. Debug

Optional: support `?debug=1` on the API to return extra fields (e.g. row breakdown, last five points) for troubleshooting.
