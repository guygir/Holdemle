-- Backfill average_first_guess_percent_diff from guess_history (first attempt) + puzzle hands.
-- Same rule as the app: per completed game, sum over hands of |guessed% - actual%| for attempt 1 only.
-- Also clears stale DEFAULT 0 for users with no derivable metric (so they sort/display as unknown, not "perfect").

CREATE OR REPLACE FUNCTION public._first_guess_diff_one_row(guess_history jsonb, hands jsonb)
RETURNS numeric
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  first_attempt jsonb;
  guesses_arr jsonb;
  i int;
  glen int;
  g jsonb;
  pos int;
  guessed_pct numeric;
  actual_pct numeric;
  total numeric := 0;
  nh int;
BEGIN
  IF guess_history IS NULL OR jsonb_typeof(guess_history) <> 'array' THEN
    RETURN NULL;
  END IF;
  nh := jsonb_array_length(guess_history);
  IF nh IS NULL OR nh < 1 THEN
    RETURN NULL;
  END IF;

  first_attempt := guess_history->0;
  guesses_arr := first_attempt->'guesses';
  IF guesses_arr IS NULL OR jsonb_typeof(guesses_arr) <> 'array' THEN
    RETURN NULL;
  END IF;

  glen := jsonb_array_length(guesses_arr);
  IF glen IS NULL OR glen < 1 THEN
    RETURN NULL;
  END IF;

  FOR i IN 0 .. (glen - 1)
  LOOP
    g := guesses_arr->i;
    pos := (g->>'position')::int;
    guessed_pct := COALESCE((g->>'percent')::numeric, 0);
    actual_pct := 0;

    SELECT COALESCE((elem.value->>'actualPercent')::numeric, 0)
    INTO actual_pct
    FROM jsonb_array_elements(COALESCE(hands, '[]'::jsonb)) AS elem
    WHERE (elem.value->>'position')::int = pos
    LIMIT 1;

    total := total + ABS(guessed_pct - actual_pct);
  END LOOP;

  RETURN total;
END;
$$;

CREATE TEMP TABLE _agg_first_guess_backfill (
  user_id uuid PRIMARY KEY,
  avg_first numeric NOT NULL
) ON COMMIT DROP;

INSERT INTO _agg_first_guess_backfill (user_id, avg_first)
WITH diffs AS (
  SELECT
    g.user_id,
    public._first_guess_diff_one_row(g.guess_history, p.hands) AS d
  FROM public.guesses g
  INNER JOIN public.puzzles p ON p.id = g.puzzle_id
  WHERE g.guess_history IS NOT NULL
    AND jsonb_typeof(g.guess_history) = 'array'
    AND jsonb_array_length(g.guess_history) > 0
    AND g.guesses_used > 0
    AND (g.is_solved OR g.guesses_used >= 5)
),
agg AS (
  SELECT
    user_id,
    ROUND(AVG(d)::numeric, 2) AS avg_first
  FROM diffs
  WHERE d IS NOT NULL
  GROUP BY user_id
)
SELECT user_id, avg_first FROM agg;

UPDATE public.user_stats us
SET
  average_first_guess_percent_diff = t.avg_first,
  updated_at = NOW()
FROM _agg_first_guess_backfill t
WHERE us.user_id = t.user_id;

-- Stale DEFAULT 0 reads as "best" on the leaderboard (lower is better); clear when we have no backfill row.
UPDATE public.user_stats us
SET
  average_first_guess_percent_diff = NULL,
  updated_at = NOW()
WHERE us.user_id NOT IN (SELECT user_id FROM _agg_first_guess_backfill)
  AND us.average_first_guess_percent_diff = 0;

DROP FUNCTION IF EXISTS public._first_guess_diff_one_row(guess_history jsonb, hands jsonb);
