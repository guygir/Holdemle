-- Add unique constraint on nickname (case-insensitive)
-- First, resolve existing duplicates by appending _N suffix
WITH duplicates AS (
  SELECT user_id, nickname, LOWER(nickname) as lower_nick,
    ROW_NUMBER() OVER (PARTITION BY LOWER(nickname) ORDER BY created_at) as rn
  FROM profiles
),
to_update AS (
  SELECT user_id, nickname || '_' || rn as new_nickname
  FROM duplicates
  WHERE rn > 1
)
UPDATE profiles p
SET nickname = t.new_nickname
FROM to_update t
WHERE p.user_id = t.user_id;

-- Now create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS profiles_nickname_lower_unique
  ON profiles (LOWER(nickname));
