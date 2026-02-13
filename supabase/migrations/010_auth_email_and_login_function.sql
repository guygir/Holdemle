-- Ensure profiles.email exists and is used for auth lookup (trigger already sets it)
-- Add a SECURITY DEFINER function so only backend can lookup email by nickname
-- This avoids exposing email through normal RLS

-- Function to lookup email by nickname - SECURITY DEFINER so only service role can call
-- (anon/authenticated are revoked)
CREATE OR REPLACE FUNCTION public.get_auth_email_for_nickname(p_nickname TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email
  FROM profiles
  WHERE LOWER(nickname) = LOWER(TRIM(p_nickname))
  LIMIT 1;
  RETURN v_email;
END;
$$;

-- Revoke from anon/authenticated; service_role retains execute
REVOKE EXECUTE ON FUNCTION public.get_auth_email_for_nickname(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_auth_email_for_nickname(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_auth_email_for_nickname(TEXT) FROM authenticated;
-- Grant to service_role (backend only)
GRANT EXECUTE ON FUNCTION public.get_auth_email_for_nickname(TEXT) TO service_role;
-- Service role retains access by default
