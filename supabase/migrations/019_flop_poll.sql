-- Migration: New Poll - 4-hand Post Flop Puzzles
-- Created: 2026-03-12
-- Description: Deactivates old poll, inserts new poll about 4-hand post flop puzzles.
--              New poll = new UUID, clean sheet (no prior votes).

-- Deactivate the previous poll (3-hand/5-hand question)
UPDATE polls
SET is_active = false, updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid;

-- Insert new poll: 4-hand post flop puzzles
INSERT INTO polls (id, question, options, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'Would you like to see 4-hand post flop puzzles featured in the daily puzzle?',
  '["No", "Yes, 1 in every 8", "Yes, 1 in every 4", "Yes, 1 in every 2"]'::jsonb,
  true
);

-- Made with Bob
