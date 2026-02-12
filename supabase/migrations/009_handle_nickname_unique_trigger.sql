-- Update trigger to ensure nickname uniqueness when inserting new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_nick TEXT;
  try_nick TEXT;
  suffix INT := 1;
BEGIN
  base_nick := COALESCE(TRIM(new.raw_user_meta_data->>'nickname'), split_part(COALESCE(new.email, ''), '@', 1), 'Player');
  try_nick := base_nick;

  -- Find unique nickname: if LOWER(try_nick) exists (excluding our user_id for updates), append _2, _3, etc.
  WHILE EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(nickname) = LOWER(try_nick)
    AND user_id != new.id
  ) LOOP
    suffix := suffix + 1;
    try_nick := base_nick || '_' || suffix;
  END LOOP;

  INSERT INTO public.profiles (user_id, nickname, email)
  VALUES (new.id, try_nick, new.email)
  ON CONFLICT (user_id) DO UPDATE SET
    nickname = try_nick,
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
