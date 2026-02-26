-- Replace timer ticks with event-based play sessions (start/pause/resume).
-- Server computes elapsed time from its own timestamps; no client-reported time.
-- Safe if only 013 was run (no 014): DROP IF EXISTS handles both.

DROP TABLE IF EXISTS puzzle_timer_ticks;
DROP FUNCTION IF EXISTS increment_puzzle_timer_tick(UUID, UUID);

-- Play sessions: server is source of truth for time
CREATE TABLE puzzle_play_sessions (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id UUID REFERENCES puzzles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  paused_at TIMESTAMP WITH TIME ZONE,
  total_pause_seconds INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, puzzle_id)
);

ALTER TABLE puzzle_play_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own play sessions"
  ON puzzle_play_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
