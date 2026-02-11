-- Add percent_diff to guesses (sum of |guessed - actual| for final attempt)
ALTER TABLE guesses ADD COLUMN IF NOT EXISTS percent_diff DECIMAL(10,2) DEFAULT 0;

-- Add average_percent_diff to user_stats for all-time leaderboard
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS average_percent_diff DECIMAL(10,2) DEFAULT 0;
