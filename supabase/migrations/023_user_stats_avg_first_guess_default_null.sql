-- New rows should not default to 0 (reads as a perfect gut-feeling score on leaderboards).
ALTER TABLE public.user_stats
  ALTER COLUMN average_first_guess_percent_diff DROP DEFAULT;

ALTER TABLE public.user_stats
  ALTER COLUMN average_first_guess_percent_diff SET DEFAULT NULL;
