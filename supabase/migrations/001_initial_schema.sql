-- Puzzles table
CREATE TABLE IF NOT EXISTS puzzles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  puzzle_date DATE UNIQUE NOT NULL,
  hands JSONB NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guesses table
CREATE TABLE IF NOT EXISTS guesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  puzzle_id UUID REFERENCES puzzles(id) ON DELETE CASCADE NOT NULL,
  guess_history JSONB NOT NULL,
  guesses_used INTEGER NOT NULL,
  is_solved BOOLEAN NOT NULL,
  time_taken_seconds INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, puzzle_id)
);

-- User stats table
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_games INTEGER DEFAULT 0,
  solved_in_one INTEGER DEFAULT 0,
  solved_in_two INTEGER DEFAULT 0,
  solved_in_three INTEGER DEFAULT 0,
  failed_games INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  average_guesses DECIMAL(5,2) DEFAULT 0,
  last_played_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_puzzles_date ON puzzles(puzzle_date);
CREATE INDEX IF NOT EXISTS idx_guesses_user ON guesses(user_id);
CREATE INDEX IF NOT EXISTS idx_guesses_puzzle ON guesses(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_guesses_score ON guesses(total_score DESC);

-- Enable RLS
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view today's puzzle"
  ON puzzles FOR SELECT
  USING (puzzle_date = CURRENT_DATE);

CREATE POLICY "Users can insert own guesses"
  ON guesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own guesses"
  ON guesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);
