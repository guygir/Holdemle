-- Profiles table for nickname and display (populated by trigger on signup)
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger: create profile when user signs up (nickname from raw_user_meta_data)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nickname, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nickname', split_part(COALESCE(new.email, ''), '@', 1), 'Player'),
    new.email
  )
  ON CONFLICT (user_id) DO UPDATE SET
    nickname = COALESCE(EXCLUDED.nickname, profiles.nickname),
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users (no profile yet)
INSERT INTO public.profiles (user_id, nickname, email)
SELECT id, COALESCE(raw_user_meta_data->>'nickname', split_part(COALESCE(email, ''), '@', 1), 'Player'), email
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
