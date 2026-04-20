-- Running average of first-guess |Δ%| per completed game (aligned with guess_history[0])
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS average_first_guess_percent_diff DECIMAL(10,2) DEFAULT 0;
