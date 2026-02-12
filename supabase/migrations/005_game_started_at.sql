-- Store when the game started for timer restoration when user returns
-- Set on first guess only; used to show correct elapsed time
ALTER TABLE guesses ADD COLUMN IF NOT EXISTS game_started_at TIMESTAMP WITH TIME ZONE;

-- Backfill: for existing rows, approximate from submitted_at and time_taken_seconds
UPDATE guesses
SET game_started_at = submitted_at - (time_taken_seconds * interval '1 second')
WHERE game_started_at IS NULL AND submitted_at IS NOT NULL;
