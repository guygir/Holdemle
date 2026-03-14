-- Migration: Add flop column to puzzles for post-flop daily puzzles
-- Created: 2026-03-12
-- Description: Optional flop [card, card, card] for 4-hand post-flop puzzles

ALTER TABLE puzzles ADD COLUMN IF NOT EXISTS flop JSONB;

COMMENT ON COLUMN puzzles.flop IS 'Optional flop cards [c1, c2, c3] for post-flop puzzles; null for pre-flop';

-- Made with Bob
