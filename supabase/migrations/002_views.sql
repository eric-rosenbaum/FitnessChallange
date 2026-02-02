-- View: Active week for a group
CREATE OR REPLACE VIEW v_active_week AS
SELECT 
  wa.id,
  wa.group_id,
  wa.start_date,
  wa.end_date,
  wa.host_user_id,
  p.display_name as host_name,
  wa.assigned_by,
  wc.id as challenge_id,
  wc.cardio_metric,
  wc.cardio_target,
  wc.created_by as challenge_created_by
FROM week_assignments wa
LEFT JOIN week_challenges wc ON wc.week_assignment_id = wa.id
LEFT JOIN profiles p ON p.id = wa.host_user_id
WHERE CURRENT_DATE BETWEEN wa.start_date AND wa.end_date;

-- View: Week exercises
CREATE OR REPLACE VIEW v_week_exercises AS
SELECT 
  se.id,
  se.week_challenge_id,
  se.name,
  se.target_reps,
  se.sort_order,
  se.created_at
FROM strength_exercises se
ORDER BY se.sort_order;

-- View: User week progress (fixed: no nested aggregates)
CREATE OR REPLACE VIEW v_user_week_progress AS
WITH
strength_totals AS (
  SELECT
    wl.week_challenge_id,
    wl.user_id,
    wl.exercise_id,
    SUM(wl.strength_reps) AS reps_total,
    MAX(wl.created_at) AS last_strength_at
  FROM workout_logs wl
  WHERE wl.log_type = 'strength'
  GROUP BY wl.week_challenge_id, wl.user_id, wl.exercise_id
),
cardio_totals AS (
  SELECT
    wl.week_challenge_id,
    wl.user_id,
    SUM(wl.cardio_amount) AS cardio_total,
    MAX(wl.created_at) AS last_cardio_at
  FROM workout_logs wl
  WHERE wl.log_type = 'cardio'
  GROUP BY wl.week_challenge_id, wl.user_id
),
active_users AS (
  -- users who have any log (cardio or strength) for the challenge
  SELECT
    week_challenge_id,
    user_id,
    MAX(last_activity_at) AS last_activity_at
  FROM (
    SELECT week_challenge_id, user_id, last_strength_at AS last_activity_at
    FROM strength_totals
    UNION ALL
    SELECT week_challenge_id, user_id, last_cardio_at AS last_activity_at
    FROM cardio_totals
  ) x
  GROUP BY week_challenge_id, user_id
)
SELECT
  wc.id AS challenge_id,
  au.user_id,

  -- Cardio totals
  COALESCE(ct.cardio_total, 0) AS cardio_total,

  -- Exercise totals (already pre-summed per exercise in strength_totals)
  jsonb_object_agg(
    se.id::text,
    COALESCE(st.reps_total, 0)
  ) FILTER (WHERE se.id IS NOT NULL) AS exercise_totals,

  -- Cardio progress
  LEAST(
    COALESCE(ct.cardio_total, 0) / NULLIF(wc.cardio_target, 0),
    1.0
  ) AS cardio_progress,

  -- Strength progress (average over exercises)
  COALESCE(
    AVG(
      LEAST(
        COALESCE(st.reps_total, 0) / NULLIF(se.target_reps, 0),
        1.0
      )
    ) FILTER (WHERE se.id IS NOT NULL),
    0
  ) AS strength_overall_progress,

  -- Total progress (average of cardio + strength)
  (
    LEAST(
      COALESCE(ct.cardio_total, 0) / NULLIF(wc.cardio_target, 0),
      1.0
    )
    +
    COALESCE(
      AVG(
        LEAST(
          COALESCE(st.reps_total, 0) / NULLIF(se.target_reps, 0),
          1.0
        )
      ) FILTER (WHERE se.id IS NOT NULL),
      0
    )
  ) / 2.0 AS total_progress,

  au.last_activity_at
FROM active_users au
JOIN week_challenges wc
  ON wc.id = au.week_challenge_id
LEFT JOIN cardio_totals ct
  ON ct.week_challenge_id = wc.id
 AND ct.user_id = au.user_id
LEFT JOIN strength_exercises se
  ON se.week_challenge_id = wc.id
LEFT JOIN strength_totals st
  ON st.week_challenge_id = wc.id
 AND st.user_id = au.user_id
 AND st.exercise_id = se.id
GROUP BY
  wc.id,
  au.user_id,
  wc.cardio_target,
  ct.cardio_total,
  au.last_activity_at;

  -- Total progress
  (
    LEAST(COALESCE(SUM(CASE WHEN wl.log_type = 'cardio' THEN wl.cardio_amount ELSE 0 END), 0) / NULLIF(wc.cardio_target, 0), 1.0) +
    COALESCE(
      AVG(LEAST(
        COALESCE(SUM(CASE WHEN wl.log_type = 'strength' AND wl.exercise_id = se.id THEN wl.strength_reps ELSE 0 END), 0) / NULLIF(se.target_reps, 0),
        1.0
      )) FILTER (WHERE se.id IS NOT NULL),
      0
    )
  ) / 2.0 as total_progress,
  MAX(wl.created_at) as last_activity_at
FROM week_challenges wc
LEFT JOIN strength_exercises se ON se.week_challenge_id = wc.id
LEFT JOIN workout_logs wl ON wl.week_challenge_id = wc.id AND (wl.log_type = 'strength' AND wl.exercise_id = se.id OR wl.log_type = 'cardio')
GROUP BY wc.id, wl.user_id, wc.cardio_target;

-- View: Leaderboard for active week
CREATE OR REPLACE VIEW v_leaderboard_active_week AS
SELECT 
  up.user_id,
  p.display_name,
  up.cardio_progress,
  up.strength_overall_progress,
  up.total_progress,
  up.last_activity_at
FROM v_user_week_progress up
JOIN profiles p ON p.id = up.user_id
JOIN v_active_week aw ON aw.challenge_id = up.challenge_id
ORDER BY 
  up.total_progress DESC,
  up.cardio_progress DESC,
  up.strength_overall_progress DESC;

-- View: Activity feed for active week
CREATE OR REPLACE VIEW v_activity_feed_active_week AS
SELECT 
  wl.id,
  wl.user_id,
  p.display_name,
  wl.log_type,
  wl.cardio_activity,
  wl.cardio_amount,
  se.name as exercise_name,
  wl.strength_reps,
  wl.created_at
FROM workout_logs wl
JOIN profiles p ON p.id = wl.user_id
LEFT JOIN strength_exercises se ON se.id = wl.exercise_id
JOIN v_active_week aw ON aw.challenge_id = wl.week_challenge_id
ORDER BY wl.created_at DESC;
