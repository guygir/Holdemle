-- Error on duplicate nickname instead of appending _2, _3, etc.
-- API already checks before signup; this is a safety net (triggers rollback on race)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  nick TEXT;
BEGIN
  nick := COALESCE(TRIM(new.raw_user_meta_data->>'nickname'), split_part(COALESCE(new.email, ''), '@', 1), 'Player');

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(nickname) = LOWER(nick)
    AND user_id != new.id
  ) THEN
    RAISE EXCEPTION 'Nickname "%" is already taken', nick;
  END IF;

  INSERT INTO public.profiles (user_id, nickname, email)
  VALUES (new.id, nick, new.email)
  ON CONFLICT (user_id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
