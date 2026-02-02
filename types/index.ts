// Type definitions for the app

export type CardioActivity = 'run' | 'walk' | 'bike' | 'other'
export type CardioMetric = 'miles' | 'minutes'
export type LogType = 'cardio' | 'strength'
export type UserRole = 'admin' | 'member'

export interface Profile {
  id: string
  display_name: string
  created_at: string
}

export interface Group {
  id: string
  name: string
  invite_code: string
  created_by: string
  created_at: string
}

export interface GroupMembership {
  id: string
  group_id: string
  user_id: string
  role: UserRole
  created_at: string
}

export interface WeekAssignment {
  id: string
  group_id: string
  start_date: string // ISO date string
  end_date: string // ISO date string
  host_user_id: string
  assigned_by: string
  created_at: string
}

export interface StrengthExercise {
  id: string
  week_challenge_id: string
  name: string
  target_reps: number
  sort_order: number
  created_at: string
}

export interface WeekChallenge {
  id: string
  group_id: string
  week_assignment_id: string
  created_by: string
  cardio_metric: CardioMetric
  cardio_target: number
  created_at: string
}

export interface WorkoutLog {
  id: string
  group_id: string
  week_challenge_id: string
  user_id: string
  logged_at: string // ISO date string
  created_at: string
  log_type: LogType
  // Cardio fields (nullable if strength)
  cardio_activity?: CardioActivity
  cardio_amount?: number
  // Strength fields (nullable if cardio)
  exercise_id?: string
  strength_reps?: number
  // Other
  note?: string
}

// Extended types for UI
export interface UserProgress {
  user_id: string
  display_name: string
  cardio_total: number
  cardio_progress: number
  strength_overall_progress: number
  total_progress: number
  last_activity_at?: string
  exercise_totals: Record<string, number> // exercise_id -> total reps
}

export interface ActivityFeedItem {
  id: string
  user_id: string
  display_name: string
  log_type: LogType
  cardio_activity?: CardioActivity
  cardio_amount?: number
  exercise_name?: string
  strength_reps?: number
  created_at: string
}

export interface ActiveWeek {
  week_assignment: WeekAssignment
  challenge?: WeekChallenge
  exercises: StrengthExercise[]
  host_name: string
}
