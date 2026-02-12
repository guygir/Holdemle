-- Store elapsed time when user leaves the game page (for timer pause/resume)
ALTER TABLE guesses ADD COLUMN IF NOT EXISTS paused_elapsed_seconds INTEGER;
