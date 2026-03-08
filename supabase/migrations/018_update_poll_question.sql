-- Migration: Update Poll Question Text
-- Created: 2026-03-08
-- Description: Updates the poll question to use "featured in" instead of "added to"

UPDATE polls
SET question = 'Would you like to see 3-hand and 5-hand puzzles featured in the daily puzzle?'
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid;

-- Made with Bob