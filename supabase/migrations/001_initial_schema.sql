-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Group memberships table
CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Week assignments table
CREATE TABLE week_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  host_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_date <= end_date)
);

-- Week challenges table
CREATE TABLE week_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  week_assignment_id UUID UNIQUE NOT NULL REFERENCES week_assignments(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  cardio_metric TEXT NOT NULL CHECK (cardio_metric IN ('miles', 'minutes')),
  cardio_target NUMERIC NOT NULL CHECK (cardio_target > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Strength exercises table
CREATE TABLE strength_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_challenge_id UUID NOT NULL REFERENCES week_challenges(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (LENGTH(name) <= 50),
  target_reps INTEGER NOT NULL CHECK (target_reps > 0),
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workout logs table
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  week_challenge_id UUID NOT NULL REFERENCES week_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logged_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  log_type TEXT NOT NULL CHECK (log_type IN ('cardio', 'strength')),
  -- Cardio fields
  cardio_activity TEXT CHECK (cardio_activity IN ('run', 'walk', 'bike', 'other')),
  cardio_amount NUMERIC CHECK (cardio_amount >= 0),
  -- Strength fields
  exercise_id UUID REFERENCES strength_exercises(id) ON DELETE RESTRICT,
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
CREATE INDEX idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX idx_week_assignments_group_id ON week_assignments(group_id);
CREATE INDEX idx_week_assignments_dates ON week_assignments(group_id, start_date, end_date);
CREATE INDEX idx_week_challenges_assignment_id ON week_challenges(week_assignment_id);
CREATE INDEX idx_strength_exercises_challenge_id ON strength_exercises(week_challenge_id);
CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_challenge_id ON workout_logs(week_challenge_id);
CREATE INDEX idx_workout_logs_logged_at ON workout_logs(logged_at);
