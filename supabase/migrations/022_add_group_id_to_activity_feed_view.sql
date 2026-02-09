-- Add group_id to activity feed view and filter by group
-- This ensures activity feed only shows logs from users in the same group

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
  wl.created_at,
  aw.group_id
FROM workout_logs wl
JOIN profiles p ON p.id = wl.user_id
LEFT JOIN strength_exercises se ON se.id = wl.exercise_id
JOIN v_active_week aw ON aw.challenge_id = wl.week_challenge_id
ORDER BY wl.created_at DESC;
