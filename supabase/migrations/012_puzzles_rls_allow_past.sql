-- Allow viewing puzzles on or before today.
-- Before: only puzzle_date = CURRENT_DATE (today's puzzle only).
-- After: puzzle_date <= CURRENT_DATE so users see yesterday's puzzle when
--       today's cron hasn't run yet (getCurrentPuzzleDate returns most recent).

DROP POLICY IF EXISTS "Anyone can view today's puzzle" ON puzzles;

CREATE POLICY "Anyone can view current and past puzzles"
  ON puzzles FOR SELECT
  USING (puzzle_date <= CURRENT_DATE);
