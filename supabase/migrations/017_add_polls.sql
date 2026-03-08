-- Migration: Add Polls Feature
-- Created: 2026-03-08
-- Description: Adds polls table and poll_votes table for community voting on features

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Polls Table
-- =====================================================
-- Stores poll questions and options
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of option strings
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_polls_is_active ON polls(is_active);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at DESC);

COMMENT ON TABLE polls IS 'Stores poll questions for community feedback';
COMMENT ON COLUMN polls.options IS 'JSONB array of option strings';
COMMENT ON COLUMN polls.is_active IS 'Whether the poll is currently active and visible';

-- =====================================================
-- Poll Votes Table
-- =====================================================
-- Stores user votes for polls (one vote per user per poll, can be changed)
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option TEXT NOT NULL, -- The selected option (must match one of the poll.options values)
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id) -- One vote per user per poll
);

CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_voted_at ON poll_votes(voted_at DESC);

COMMENT ON TABLE poll_votes IS 'Stores user votes for polls (one vote per user per poll, can be updated)';
COMMENT ON COLUMN poll_votes.option IS 'The selected option text (must match one of poll.options)';

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls: Everyone can read active polls
CREATE POLICY "Anyone can view active polls"
  ON polls FOR SELECT
  USING (is_active = true);

-- Polls: Only admins can insert/update/delete (handled via service role)
-- No public insert/update/delete policies

-- Poll Votes: Users can view all votes (for results aggregation)
CREATE POLICY "Anyone can view poll votes"
  ON poll_votes FOR SELECT
  USING (true);

-- Poll Votes: Authenticated users can insert their own votes
CREATE POLICY "Authenticated users can insert their own votes"
  ON poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Poll Votes: Users can update their own votes
CREATE POLICY "Users can update their own votes"
  ON poll_votes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Poll Votes: Users can delete their own votes
CREATE POLICY "Users can delete their own votes"
  ON poll_votes FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Seed Initial Poll
-- =====================================================
-- Insert poll about 3-hand and 5-hand modes
INSERT INTO polls (id, question, options, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Would you like to see 3-hand and 5-hand puzzles featured in the daily puzzle?',
  '["Yes, add both modes", "Yes, but only 3-hand", "Yes, but only 5-hand", "No, keep it 4-hand only"]'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Made with Bob