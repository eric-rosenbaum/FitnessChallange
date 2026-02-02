export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string
          created_at: string
        }
        Insert: {
          id: string
          display_name: string
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          created_by?: string
          created_at?: string
        }
      }
      group_memberships: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'admin' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'admin' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          created_at?: string
        }
      }
      week_assignments: {
        Row: {
          id: string
          group_id: string
          start_date: string
          end_date: string
          host_user_id: string
          assigned_by: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          start_date: string
          end_date: string
          host_user_id: string
          assigned_by: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          start_date?: string
          end_date?: string
          host_user_id?: string
          assigned_by?: string
          created_at?: string
        }
      }
      week_challenges: {
        Row: {
          id: string
          group_id: string
          week_assignment_id: string
          created_by: string
          cardio_metric: 'miles' | 'minutes'
          cardio_target: number
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          week_assignment_id: string
          created_by: string
          cardio_metric: 'miles' | 'minutes'
          cardio_target: number
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          week_assignment_id?: string
          created_by?: string
          cardio_metric?: 'miles' | 'minutes'
          cardio_target?: number
          created_at?: string
        }
      }
      strength_exercises: {
        Row: {
          id: string
          week_challenge_id: string
          name: string
          target_reps: number
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          week_challenge_id: string
          name: string
          target_reps: number
          sort_order: number
          created_at?: string
        }
        Update: {
          id?: string
          week_challenge_id?: string
          name?: string
          target_reps?: number
          sort_order?: number
          created_at?: string
        }
      }
      workout_logs: {
        Row: {
          id: string
          group_id: string
          week_challenge_id: string
          user_id: string
          logged_at: string
          created_at: string
          log_type: 'cardio' | 'strength'
          cardio_activity: 'run' | 'walk' | 'bike' | 'other' | null
          cardio_amount: number | null
          exercise_id: string | null
          strength_reps: number | null
          note: string | null
        }
        Insert: {
          id?: string
          group_id: string
          week_challenge_id: string
          user_id: string
          logged_at: string
          created_at?: string
          log_type: 'cardio' | 'strength'
          cardio_activity?: 'run' | 'walk' | 'bike' | 'other' | null
          cardio_amount?: number | null
          exercise_id?: string | null
          strength_reps?: number | null
          note?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          week_challenge_id?: string
          user_id?: string
          logged_at?: string
          created_at?: string
          log_type?: 'cardio' | 'strength'
          cardio_activity?: 'run' | 'walk' | 'bike' | 'other' | null
          cardio_amount?: number | null
          exercise_id?: string | null
          strength_reps?: number | null
          note?: string | null
        }
      }
    }
    Views: {
      v_active_week: {
        Row: {
          id: string
          group_id: string
          start_date: string
          end_date: string
          host_user_id: string
          host_name: string
          assigned_by: string
          challenge_id: string | null
          cardio_metric: 'miles' | 'minutes' | null
          cardio_target: number | null
          challenge_created_by: string | null
        }
      }
      v_week_exercises: {
        Row: {
          id: string
          week_challenge_id: string
          name: string
          target_reps: number
          sort_order: number
          created_at: string
        }
      }
      v_user_week_progress: {
        Row: {
          challenge_id: string
          user_id: string
          cardio_total: number
          exercise_totals: Json
          cardio_progress: number
          strength_overall_progress: number
          total_progress: number
          last_activity_at: string | null
        }
      }
      v_leaderboard_active_week: {
        Row: {
          user_id: string
          display_name: string
          cardio_progress: number
          strength_overall_progress: number
          total_progress: number
          last_activity_at: string | null
        }
      }
      v_activity_feed_active_week: {
        Row: {
          id: string
          user_id: string
          display_name: string
          log_type: 'cardio' | 'strength'
          cardio_activity: 'run' | 'walk' | 'bike' | 'other' | null
          cardio_amount: number | null
          exercise_name: string | null
          strength_reps: number | null
          created_at: string
        }
      }
    }
  }
}
