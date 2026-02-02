import type {
  Profile,
  Group,
  GroupMembership,
  WeekAssignment,
  WeekChallenge,
  StrengthExercise,
  WorkoutLog,
  UserProgress,
  ActivityFeedItem,
  ActiveWeek,
  CardioActivity,
} from '@/types'

// Dummy data - simulating a group with an active challenge
export const dummyCurrentUserId = 'user-1'

export const dummyProfiles: Profile[] = [
  { id: 'user-1', display_name: 'You', created_at: '2024-01-01T00:00:00Z' },
  { id: 'user-2', display_name: 'Alice', created_at: '2024-01-01T00:00:00Z' },
  { id: 'user-3', display_name: 'Bob', created_at: '2024-01-01T00:00:00Z' },
  { id: 'user-4', display_name: 'Charlie', created_at: '2024-01-01T00:00:00Z' },
  { id: 'user-5', display_name: 'Diana', created_at: '2024-01-01T00:00:00Z' },
]

export const dummyGroup: Group = {
  id: 'group-1',
  name: 'Fitness Friends',
  invite_code: 'FIT2024',
  created_by: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
}

export const dummyMemberships: GroupMembership[] = [
  { id: 'm1', group_id: 'group-1', user_id: 'user-1', role: 'admin', created_at: '2024-01-01T00:00:00Z' },
  { id: 'm2', group_id: 'group-1', user_id: 'user-2', role: 'member', created_at: '2024-01-01T00:00:00Z' },
  { id: 'm3', group_id: 'group-1', user_id: 'user-3', role: 'member', created_at: '2024-01-01T00:00:00Z' },
  { id: 'm4', group_id: 'group-1', user_id: 'user-4', role: 'member', created_at: '2024-01-01T00:00:00Z' },
  { id: 'm5', group_id: 'group-1', user_id: 'user-5', role: 'member', created_at: '2024-01-01T00:00:00Z' },
]

// Current week: Jan 15-21, 2024
const today = new Date()
const startOfWeek = new Date(today)
startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday
const endOfWeek = new Date(startOfWeek)
endOfWeek.setDate(startOfWeek.getDate() + 6) // Saturday

export const dummyWeekAssignment: WeekAssignment = {
  id: 'week-1',
  group_id: 'group-1',
  start_date: startOfWeek.toISOString().split('T')[0],
  end_date: endOfWeek.toISOString().split('T')[0],
  host_user_id: 'user-2', // Alice is host
  assigned_by: 'user-1',
  created_at: '2024-01-14T00:00:00Z',
}

export const dummyWeekChallenge: WeekChallenge = {
  id: 'challenge-1',
  group_id: 'group-1',
  week_assignment_id: 'week-1',
  created_by: 'user-2',
  cardio_metric: 'miles',
  cardio_target: 20,
  created_at: '2024-01-15T00:00:00Z',
}

export const dummyExercises: StrengthExercise[] = [
  { id: 'ex-1', week_challenge_id: 'challenge-1', name: 'Pushups', target_reps: 200, sort_order: 1, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ex-2', week_challenge_id: 'challenge-1', name: 'Squats', target_reps: 100, sort_order: 2, created_at: '2024-01-15T00:00:00Z' },
  { id: 'ex-3', week_challenge_id: 'challenge-1', name: 'Pull-ups', target_reps: 50, sort_order: 3, created_at: '2024-01-15T00:00:00Z' },
]

export const dummyLogs: WorkoutLog[] = [
  // User 1 (You) logs
  { id: 'log-1', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-1', logged_at: '2024-01-15', created_at: '2024-01-15T08:00:00Z', log_type: 'cardio', cardio_activity: 'run', cardio_amount: 3.5 },
  { id: 'log-2', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-1', logged_at: '2024-01-15', created_at: '2024-01-15T18:00:00Z', log_type: 'strength', exercise_id: 'ex-1', strength_reps: 50 },
  { id: 'log-3', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-1', logged_at: '2024-01-16', created_at: '2024-01-16T07:00:00Z', log_type: 'cardio', cardio_activity: 'bike', cardio_amount: 5.2 },
  { id: 'log-4', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-1', logged_at: '2024-01-16', created_at: '2024-01-16T19:00:00Z', log_type: 'strength', exercise_id: 'ex-1', strength_reps: 40, note: 'Feeling strong!' },
  { id: 'log-5', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-1', logged_at: '2024-01-17', created_at: '2024-01-17T08:30:00Z', log_type: 'strength', exercise_id: 'ex-2', strength_reps: 30 },
  { id: 'log-6', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-1', logged_at: '2024-01-17', created_at: '2024-01-17T20:00:00Z', log_type: 'cardio', cardio_activity: 'run', cardio_amount: 4.0 },
  
  // User 2 (Alice) logs
  { id: 'log-7', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-2', logged_at: '2024-01-15', created_at: '2024-01-15T09:00:00Z', log_type: 'cardio', cardio_activity: 'walk', cardio_amount: 2.5 },
  { id: 'log-8', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-2', logged_at: '2024-01-16', created_at: '2024-01-16T10:00:00Z', log_type: 'strength', exercise_id: 'ex-1', strength_reps: 60 },
  { id: 'log-9', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-2', logged_at: '2024-01-17', created_at: '2024-01-17T11:00:00Z', log_type: 'cardio', cardio_activity: 'run', cardio_amount: 5.0 },
  
  // User 3 (Bob) logs
  { id: 'log-10', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-3', logged_at: '2024-01-15', created_at: '2024-01-15T12:00:00Z', log_type: 'cardio', cardio_activity: 'bike', cardio_amount: 8.0 },
  { id: 'log-11', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-3', logged_at: '2024-01-16', created_at: '2024-01-16T13:00:00Z', log_type: 'strength', exercise_id: 'ex-2', strength_reps: 50 },
  { id: 'log-12', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-3', logged_at: '2024-01-17', created_at: '2024-01-17T14:00:00Z', log_type: 'cardio', cardio_activity: 'run', cardio_amount: 6.5 },
  { id: 'log-13', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-3', logged_at: '2024-01-17', created_at: '2024-01-17T15:00:00Z', log_type: 'strength', exercise_id: 'ex-1', strength_reps: 70 },
  
  // User 4 (Charlie) logs
  { id: 'log-14', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-4', logged_at: '2024-01-15', created_at: '2024-01-15T16:00:00Z', log_type: 'cardio', cardio_activity: 'run', cardio_amount: 3.0 },
  { id: 'log-15', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-4', logged_at: '2024-01-16', created_at: '2024-01-16T17:00:00Z', log_type: 'strength', exercise_id: 'ex-3', strength_reps: 20 },
  
  // User 5 (Diana) logs
  { id: 'log-16', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-5', logged_at: '2024-01-15', created_at: '2024-01-15T18:00:00Z', log_type: 'cardio', cardio_activity: 'walk', cardio_amount: 4.0 },
  { id: 'log-17', group_id: 'group-1', week_challenge_id: 'challenge-1', user_id: 'user-5', logged_at: '2024-01-16', created_at: '2024-01-16T19:00:00Z', log_type: 'strength', exercise_id: 'ex-1', strength_reps: 45 },
]

// Helper functions to calculate progress
function calculateCardioProgress(total: number, target: number): number {
  return Math.min(total / target, 1.0)
}

function calculateStrengthProgress(exerciseTotals: Record<string, number>, exercises: StrengthExercise[]): number {
  if (exercises.length === 0) return 0
  
  const progressValues = exercises.map(ex => {
    const total = exerciseTotals[ex.id] || 0
    return Math.min(total / ex.target_reps, 1.0)
  })
  
  return progressValues.reduce((sum, p) => sum + p, 0) / progressValues.length
}

function calculateTotalProgress(cardioProgress: number, strengthProgress: number): number {
  return (cardioProgress + strengthProgress) / 2
}

// Calculate user progress
export function calculateUserProgress(
  userId: string,
  logs: WorkoutLog[],
  challenge: WeekChallenge,
  exercises: StrengthExercise[]
): UserProgress {
  const userLogs = logs.filter(log => log.user_id === userId)
  
  // Calculate cardio total
  const cardioTotal = userLogs
    .filter(log => log.log_type === 'cardio' && log.cardio_amount)
    .reduce((sum, log) => sum + (log.cardio_amount || 0), 0)
  
  // Calculate exercise totals
  const exerciseTotals: Record<string, number> = {}
  userLogs
    .filter(log => log.log_type === 'strength' && log.exercise_id && log.strength_reps)
    .forEach(log => {
      const exId = log.exercise_id!
      exerciseTotals[exId] = (exerciseTotals[exId] || 0) + (log.strength_reps || 0)
    })
  
  const cardioProgress = calculateCardioProgress(cardioTotal, challenge.cardio_target)
  const strengthProgress = calculateStrengthProgress(exerciseTotals, exercises)
  const totalProgress = calculateTotalProgress(cardioProgress, strengthProgress)
  
  const lastActivity = userLogs.length > 0 
    ? userLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
    : undefined
  
  const profile = dummyProfiles.find(p => p.id === userId)!
  
  return {
    user_id: userId,
    display_name: profile.display_name,
    cardio_total: cardioTotal,
    cardio_progress: cardioProgress,
    strength_overall_progress: strengthProgress,
    total_progress: totalProgress,
    last_activity_at: lastActivity,
    exercise_totals: exerciseTotals,
  }
}

// Get all user progress for leaderboard
export function getAllUserProgress(
  userIds: string[],
  logs: WorkoutLog[],
  challenge: WeekChallenge,
  exercises: StrengthExercise[]
): UserProgress[] {
  return userIds.map(userId => calculateUserProgress(userId, logs, challenge, exercises))
    .sort((a, b) => {
      // Sort by total_progress descending
      if (b.total_progress !== a.total_progress) {
        return b.total_progress - a.total_progress
      }
      // Tie-breaker: higher cardio_progress
      if (b.cardio_progress !== a.cardio_progress) {
        return b.cardio_progress - a.cardio_progress
      }
      // Tie-breaker: higher strength_overall_progress
      return b.strength_overall_progress - a.strength_overall_progress
    })
}

// Get activity feed
export function getActivityFeed(logs: WorkoutLog[], limit: number = 5): ActivityFeedItem[] {
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, limit)
  
  return sortedLogs.map(log => {
    const profile = dummyProfiles.find(p => p.id === log.user_id)!
    const exercise = log.exercise_id ? dummyExercises.find(e => e.id === log.exercise_id) : undefined
    
    return {
      id: log.id,
      user_id: log.user_id,
      display_name: profile.display_name,
      log_type: log.log_type,
      cardio_activity: log.cardio_activity,
      cardio_amount: log.cardio_amount,
      exercise_name: exercise?.name,
      strength_reps: log.strength_reps,
      created_at: log.created_at,
    }
  })
}

// Get active week data
export function getActiveWeek(): ActiveWeek {
  const hostProfile = dummyProfiles.find(p => p.id === dummyWeekAssignment.host_user_id)!
  
  return {
    week_assignment: dummyWeekAssignment,
    challenge: dummyWeekChallenge,
    exercises: dummyExercises,
    host_name: hostProfile.display_name,
  }
}

// Get group completion count
export function getGroupCompletion(progressList: UserProgress[]): { finished: number; total: number } {
  const total = progressList.length
  const finished = progressList.filter(p => p.total_progress >= 1.0).length
  return { finished, total }
}
