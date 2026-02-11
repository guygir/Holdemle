-- Replace solved_in_one, solved_in_two, solved_in_three with flexible JSONB
-- Format: {"1": 5, "2": 3, "3": 2} = 5 solves in 1 guess, 3 in 2 guesses, 2 in 3 guesses
-- Scales with any MAX_GUESSES (e.g. 5 guesses -> {"4": 1, "5": 0} possible)

ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS solved_distribution JSONB DEFAULT '{}';

-- Migrate existing data from legacy columns (run before DROP)
UPDATE user_stats
SET solved_distribution = jsonb_build_object(
  '1', COALESCE(solved_in_one, 0),
  '2', COALESCE(solved_in_two, 0),
  '3', COALESCE(solved_in_three, 0)
);

-- Drop legacy columns
ALTER TABLE user_stats DROP COLUMN IF EXISTS solved_in_one;
ALTER TABLE user_stats DROP COLUMN IF EXISTS solved_in_two;
ALTER TABLE user_stats DROP COLUMN IF EXISTS solved_in_three;
