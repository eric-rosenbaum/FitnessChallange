import { createClient } from '@/lib/supabase/client'
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
  ActiveWeek
} from '@/types'

// Profiles
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, displayName: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId)
  
  if (error) throw error
}

// Groups
export async function getGroup(groupId: string): Promise<Group | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()
  
  if (error) throw error
  return data
}

export async function createGroup(name: string, inviteCode: string, userId: string): Promise<Group> {
  const supabase = createClient()
  
  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    throw new Error('Authentication required')
  }
  
  // Insert group
  const insertData = { name, invite_code: inviteCode, created_by: userId }
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert(insertData)
    .select()
    .single()
  
  if (groupError) {
    // Handle duplicate invite code error (409 Conflict)
    if (groupError.code === '23505') {
      throw new Error('This invite code is already taken. Please generate a new one.')
    }
    throw groupError
  }
  
  if (!group) {
    throw new Error('Failed to create group')
  }
  
  // Add creator as admin
  const { error: membershipError } = await supabase
    .from('group_memberships')
    .insert({ group_id: group.id, user_id: userId, role: 'admin' })
  
  if (membershipError) {
    // If membership insert fails, try to clean up the group
    await supabase.from('groups').delete().eq('id', group.id)
    throw membershipError
  }
  
  return group
}

export async function joinGroupByInviteCode(inviteCode: string, userId: string): Promise<Group> {
  const supabase = createClient()
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', inviteCode)
    .single()
  
  if (groupError) throw new Error('Invalid invite code')
  
  const { error: membershipError } = await supabase
    .from('group_memberships')
    .insert({ group_id: group.id, user_id: userId, role: 'member' })
  
  if (membershipError) throw membershipError
  
  return group
}

export async function updateGroupName(groupId: string, name: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('groups')
    .update({ name })
    .eq('id', groupId)
  
  if (error) throw error
}

// Memberships
export async function getGroupMemberships(groupId: string): Promise<GroupMembership[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('group_memberships')
    .select('*')
    .eq('group_id', groupId)
  
  if (error) throw error
  return data || []
}

export async function removeMember(groupId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('group_memberships')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)
  
  if (error) throw error
}

export async function addMemberByEmail(groupId: string, email: string): Promise<void> {
  // In production, this would send an invite email
  // For now, we'll just return (invite flow would be separate)
  throw new Error('Invite by email not yet implemented - use invite code')
}

// Week Assignments
export async function getActiveWeek(groupId: string): Promise<ActiveWeek | null> {
  const supabase = createClient()
  
  // Query week_assignments table directly instead of view (to avoid 406 errors)
  // Find the active week assignment (where current date is between start and end)
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  const { data: assignmentData, error: assignmentError } = await supabase
    .from('week_assignments')
    .select('*')
    .eq('group_id', groupId)
    .lte('start_date', today)
    .gte('end_date', today)
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  if (assignmentError) {
    console.error('Error fetching week assignment:', assignmentError)
    return null
  }
  
  if (!assignmentData) {
    return null
  }
  
  const assignment: WeekAssignment = {
    id: assignmentData.id,
    group_id: assignmentData.group_id,
    start_date: assignmentData.start_date,
    end_date: assignmentData.end_date,
    host_user_id: assignmentData.host_user_id,
    assigned_by: assignmentData.assigned_by,
    created_at: assignmentData.created_at,
  }
  
  // Get host name
  const { data: hostProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', assignmentData.host_user_id)
    .single()
  
  const host_name = hostProfile?.display_name || 'Unknown'
  
  // Get challenge if it exists
  const { data: challengeData, error: challengeError } = await supabase
    .from('week_challenges')
    .select('*')
    .eq('week_assignment_id', assignmentData.id)
    .maybeSingle()
  
  let challenge: WeekChallenge | undefined
  let exercises: StrengthExercise[] = []
  
  if (!challengeError && challengeData) {
    challenge = challengeData
    
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('strength_exercises')
      .select('*')
      .eq('week_challenge_id', challenge.id)
      .order('sort_order')
    
    if (!exercisesError && exercisesData) {
      exercises = exercisesData
    }
  }
  
  return {
    week_assignment: assignment,
    challenge,
    exercises,
    host_name,
  }
}

export async function createWeekAssignment(
  groupId: string,
  startDate: string,
  endDate: string,
  hostUserId: string,
  assignedBy: string
): Promise<WeekAssignment> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('week_assignments')
    .insert({
      group_id: groupId,
      start_date: startDate,
      end_date: endDate,
      host_user_id: hostUserId,
      assigned_by: assignedBy,
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Week Challenges
export async function createWeekChallenge(
  groupId: string,
  weekAssignmentId: string,
  createdBy: string,
  cardioMetric: 'miles' | 'minutes',
  cardioTarget: number,
  exercises: { name: string; targetReps: number }[]
): Promise<{ challenge: WeekChallenge; exercises: StrengthExercise[] }> {
  const supabase = createClient()
  // Create challenge
  const { data: challenge, error: challengeError } = await supabase
    .from('week_challenges')
    .insert({
      group_id: groupId,
      week_assignment_id: weekAssignmentId,
      created_by: createdBy,
      cardio_metric: cardioMetric,
      cardio_target: cardioTarget,
    })
    .select()
    .single()
  
  if (challengeError) throw challengeError
  
  // Create exercises
  const exercisesToInsert = exercises.map((ex, idx) => ({
    week_challenge_id: challenge.id,
    name: ex.name,
    target_reps: ex.targetReps,
    sort_order: idx + 1,
  }))
  
  const { data: exercisesData, error: exercisesError } = await supabase
    .from('strength_exercises')
    .insert(exercisesToInsert)
    .select()
  
  if (exercisesError) throw exercisesError
  
  return { challenge, exercises: exercisesData || [] }
}

export async function updateWeekChallenge(
  challengeId: string,
  cardioMetric: 'miles' | 'minutes',
  cardioTarget: number,
  exercises: { id?: string; name: string; targetReps: number }[]
): Promise<{ challenge: WeekChallenge; exercises: StrengthExercise[] }> {
  const supabase = createClient()
  // Update challenge
  const { data: challenge, error: challengeError } = await supabase
    .from('week_challenges')
    .update({
      cardio_metric: cardioMetric,
      cardio_target: cardioTarget,
    })
    .eq('id', challengeId)
    .select()
    .single()
  
  if (challengeError) throw challengeError
  
  // Delete existing exercises
  await supabase
    .from('strength_exercises')
    .delete()
    .eq('week_challenge_id', challengeId)
  
  // Insert new exercises
  const exercisesToInsert = exercises.map((ex, idx) => ({
    week_challenge_id: challengeId,
    name: ex.name,
    target_reps: ex.targetReps,
    sort_order: idx + 1,
  }))
  
  const { data: exercisesData, error: exercisesError } = await supabase
    .from('strength_exercises')
    .insert(exercisesToInsert)
    .select()
  
  if (exercisesError) throw exercisesError
  
  return { challenge, exercises: exercisesData || [] }
}

// Workout Logs
export async function getWorkoutLogs(weekChallengeId: string, userId?: string): Promise<WorkoutLog[]> {
  const supabase = createClient()
  let query = supabase
    .from('workout_logs')
    .select('*')
    .eq('week_challenge_id', weekChallengeId)
  
  if (userId) {
    query = query.eq('user_id', userId)
  }
  
  const { data, error } = await query.order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export async function createWorkoutLog(log: Omit<WorkoutLog, 'id' | 'created_at'>): Promise<WorkoutLog> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workout_logs')
    .insert(log)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateWorkoutLog(logId: string, updates: Partial<WorkoutLog>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('workout_logs')
    .update(updates)
    .eq('id', logId)
  
  if (error) throw error
}

export async function deleteWorkoutLog(logId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('workout_logs')
    .delete()
    .eq('id', logId)
  
  if (error) throw error
}

// Progress & Leaderboard
export async function getUserProgress(
  userId: string,
  challengeId: string
): Promise<UserProgress | null> {
  const supabase = createClient()
  // Get challenge details
  const { data: challenge } = await supabase
    .from('week_challenges')
    .select('*')
    .eq('id', challengeId)
    .single()
  
  if (!challenge) return null
  
  // Get exercises
  const { data: exercises } = await supabase
    .from('strength_exercises')
    .select('*')
    .eq('week_challenge_id', challengeId)
    .order('sort_order')
  
  // Get user logs
  const { data: logs } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('week_challenge_id', challengeId)
  
  // Calculate progress
  const cardioTotal = logs
    ?.filter(log => log.log_type === 'cardio')
    .reduce((sum, log) => sum + (log.cardio_amount || 0), 0) || 0
  
  const cardioProgress = Math.min(cardioTotal / challenge.cardio_target, 1)
  
  const exerciseTotals: Record<string, number> = {}
  exercises?.forEach(ex => {
    const total = logs
      ?.filter(log => log.log_type === 'strength' && log.exercise_id === ex.id)
      .reduce((sum, log) => sum + (log.strength_reps || 0), 0) || 0
    exerciseTotals[ex.id] = total
  })
  
  const strengthProgresses = exercises?.map(ex => {
    const total = exerciseTotals[ex.id] || 0
    return Math.min(total / ex.target_reps, 1)
  }) || []
  
  const strengthOverallProgress = strengthProgresses.length > 0
    ? strengthProgresses.reduce((sum, p) => sum + p, 0) / strengthProgresses.length
    : 0
  
  const totalProgress = (cardioProgress + strengthOverallProgress) / 2
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .single()
  
  const lastActivity = logs && logs.length > 0
    ? logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
    : undefined
  
  return {
    user_id: userId,
    display_name: profile?.display_name || 'Unknown',
    cardio_total: cardioTotal,
    cardio_progress: cardioProgress,
    strength_overall_progress: strengthOverallProgress,
    total_progress: totalProgress,
    last_activity_at: lastActivity,
    exercise_totals: exerciseTotals,
  }
}

export async function getLeaderboard(groupId: string): Promise<UserProgress[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_leaderboard_active_week')
    .select('*')
  
  if (error) throw error
  if (!data) return []
  
  return data.map(row => ({
    user_id: row.user_id,
    display_name: row.display_name,
    cardio_total: 0, // Not in view, would need to calculate
    cardio_progress: row.cardio_progress,
    strength_overall_progress: row.strength_overall_progress,
    total_progress: row.total_progress,
    last_activity_at: row.last_activity_at || undefined,
    exercise_totals: {}, // Not in view
  }))
}

export async function getActivityFeed(groupId: string, limit: number = 5): Promise<ActivityFeedItem[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('v_activity_feed_active_week')
    .select('*')
    .limit(limit)
  
  if (error) throw error
  if (!data) return []
  
  return data.map(row => ({
    id: row.id,
    user_id: row.user_id,
    display_name: row.display_name,
    log_type: row.log_type,
    cardio_activity: row.cardio_activity || undefined,
    cardio_amount: row.cardio_amount || undefined,
    exercise_name: row.exercise_name || undefined,
    strength_reps: row.strength_reps || undefined,
    created_at: row.created_at,
  }))
}
