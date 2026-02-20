-- Punishments table
-- Stores punishment assignments with cardio/strength targets and date ranges
CREATE TABLE punishments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  cardio_metric TEXT CHECK (cardio_metric IN ('miles', 'minutes')),
  cardio_target NUMERIC CHECK (cardio_target > 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_date <= end_date),
  CHECK (
    (cardio_metric IS NOT NULL AND cardio_target IS NOT NULL) OR
    (cardio_metric IS NULL AND cardio_target IS NULL)
  )
);

-- Punishment exercises table
-- Stores strength exercises for punishments
CREATE TABLE punishment_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  punishment_id UUID NOT NULL REFERENCES punishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (LENGTH(name) <= 50),
  target_reps INTEGER NOT NULL CHECK (target_reps > 0),
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Punishment assignments table
-- Links punishments to specific users
CREATE TABLE punishment_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  punishment_id UUID NOT NULL REFERENCES punishments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(punishment_id, user_id)
);

-- Punishment logs table
-- Stores workout logs for punishments (separate from regular workout_logs)
CREATE TABLE punishment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  punishment_id UUID NOT NULL REFERENCES punishments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logged_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  log_type TEXT NOT NULL CHECK (log_type IN ('cardio', 'strength')),
  -- Cardio fields
  cardio_activity TEXT CHECK (cardio_activity IN ('run', 'walk', 'bike', 'other')),
  cardio_amount NUMERIC CHECK (cardio_amount >= 0),
  -- Strength fields
  exercise_id UUID REFERENCES punishment_exercises(id) ON DELETE RESTRICT,
  strength_reps INTEGER CHECK (strength_reps >= 0),
  -- Other
  note TEXT,
  -- Constraints to ensure field correctness
  CHECK (
    (log_type = 'cardio' AND cardio_activity IS NOT NULL AND cardio_amount IS NOT NULL AND exercise_id IS NULL AND strength_reps IS NULL) OR
    (log_type = 'strength' AND exercise_id IS NOT NULL AND strength_reps IS NOT NULL AND cardio_activity IS NULL AND cardio_amount IS NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_punishments_group_id ON punishments(group_id);
CREATE INDEX idx_punishments_dates ON punishments(group_id, start_date, end_date);
CREATE INDEX idx_punishment_exercises_punishment_id ON punishment_exercises(punishment_id);
CREATE INDEX idx_punishment_assignments_punishment_id ON punishment_assignments(punishment_id);
CREATE INDEX idx_punishment_assignments_user_id ON punishment_assignments(user_id);
CREATE INDEX idx_punishment_logs_user_id ON punishment_logs(user_id);
CREATE INDEX idx_punishment_logs_punishment_id ON punishment_logs(punishment_id);
CREATE INDEX idx_punishment_logs_logged_at ON punishment_logs(logged_at);
