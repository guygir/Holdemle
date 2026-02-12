-- Allow users to update their own guesses (needed for submitting guess 2, 3, etc.)
CREATE POLICY "Users can update own guesses"
  ON guesses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
