import { createClient, type SupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
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
  const supabase = createClient() as SupabaseClient as SupabaseClient
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, displayName: string): Promise<void> {
  const supabase = createClient() as SupabaseClient
  const { error } = await supabase
    .from('profiles')
    // @ts-expect-error - Supabase type inference issue with Database type
    .update({ display_name: displayName })
    .eq('id', userId)
  
  if (error) throw error
}

// Groups
export async function getGroup(groupId: string): Promise<Group | null> {
  const supabase = createClient() as SupabaseClient
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()
  
  if (error) throw error
  return data
}

export async function createGroup(name: string, inviteCode: string, userId: string): Promise<Group> {
  const supabase = createClient() as SupabaseClient
  
  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    throw new Error('Authentication required')
  }
  
  // Insert group
  const insertData = { name, invite_code: inviteCode, created_by: userId }
  const { data: group, error: groupError } = await supabase
    .from('groups')
    // @ts-expect-error - Supabase type inference issue with Database type
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
    // @ts-expect-error - Supabase type inference issue with Database type
    .insert({ group_id: (group as any).id, user_id: userId, role: 'admin' })
  
  if (membershipError) {
    // If membership insert fails, try to clean up the group
    await supabase.from('groups').delete().eq('id', (group as any).id)
    throw membershipError
  }
  
  return group
}

export async function joinGroupByInviteCode(inviteCode: string, userId: string): Promise<Group> {
  const supabase = createClient() as SupabaseClient
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', inviteCode)
    .single()
  
  if (groupError) throw new Error('Invalid invite code')
  
  const { error: membershipError } = await supabase
    .from('group_memberships')
    // @ts-expect-error - Supabase type inference issue with Database type
    .insert({ group_id: group.id, user_id: userId, role: 'member' })
  
  if (membershipError) throw membershipError
  
  return group
}

export async function updateGroupName(groupId: string, name: string): Promise<void> {
  const supabase = createClient() as SupabaseClient
  const { error } = await supabase
    .from('groups')
    // @ts-expect-error - Supabase type inference issue with Database type
    .update({ name })
    .eq('id', groupId)
  
  if (error) throw error
}

// Memberships
export async function getGroupMemberships(groupId: string): Promise<GroupMembership[]> {
  const supabase = createClient() as SupabaseClient
  const { data, error } = await supabase
    .from('group_memberships')
    .select('*')
    .eq('group_id', groupId)
  
  if (error) throw error
  return data || []
}

export async function removeMember(groupId: string, userId: string): Promise<void> {
  const supabase = createClient() as SupabaseClient
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
  const supabase = createClient() as SupabaseClient
  
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
  
  // Extract date strings, ensuring they're in YYYY-MM-DD format
  // Supabase DATE columns should return as strings, but we'll ensure format
  const rawStartDate = (assignmentData as any).start_date
  const rawEndDate = (assignmentData as any).end_date
  
  // Extract just the date part (YYYY-MM-DD) if there's any time component
  const startDate = typeof rawStartDate === 'string' 
    ? rawStartDate.split(/[T\s]/)[0] 
    : rawStartDate
  const endDate = typeof rawEndDate === 'string'
    ? rawEndDate.split(/[T\s]/)[0]
    : rawEndDate
  
  console.log('[getActiveWeek] Date conversion:', {
    rawStartDate,
    rawEndDate,
    startDate,
    endDate,
  })
  
  const assignment: WeekAssignment = {
    id: (assignmentData as any).id,
    group_id: (assignmentData as any).group_id,
    start_date: startDate,
    end_date: endDate,
    host_user_id: (assignmentData as any).host_user_id,
    assigned_by: (assignmentData as any).assigned_by,
    created_at: (assignmentData as any).created_at,
  }
  
  // Get host name
  const { data: hostProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', (assignmentData as any).host_user_id)
    .single()
  
  const host_name = (hostProfile as any)?.display_name || 'Unknown'
  
  // Get challenge if it exists
  const { data: challengeData, error: challengeError } = await supabase
    .from('week_challenges')
    .select('*')
    .eq('week_assignment_id', (assignmentData as any).id)
    .maybeSingle()
  
  let challenge: WeekChallenge | undefined
  let exercises: StrengthExercise[] = []
  
  if (!challengeError && challengeData) {
    challenge = challengeData as any
    
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('strength_exercises')
      .select('*')
      .eq('week_challenge_id', (challenge as any).id)
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
  const supabase = createClient() as SupabaseClient
  const { data, error } = await supabase
    .from('week_assignments')
    // @ts-expect-error - Supabase type inference issue with Database type
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

export async function updateWeekAssignment(
  assignmentId: string,
  hostUserId: string,
  assignedBy: string,
  startDate?: string,
  endDate?: string
): Promise<WeekAssignment> {
  const supabase = createClient() as SupabaseClient
  
  const updateData: any = {
    host_user_id: hostUserId,
    assigned_by: assignedBy,
  }
  
  if (startDate !== undefined) {
    // Ensure we're sending just the date part (YYYY-MM-DD) without any time
    const dateOnly = startDate.split(/[T\s]/)[0]
    updateData.start_date = dateOnly
    console.log('[updateWeekAssignment] Start date:', { original: startDate, dateOnly })
  }
  
  if (endDate !== undefined) {
    // Ensure we're sending just the date part (YYYY-MM-DD) without any time
    const dateOnly = endDate.split(/[T\s]/)[0]
    updateData.end_date = dateOnly
    console.log('[updateWeekAssignment] End date:', { original: endDate, dateOnly })
  }
  
  console.log('[updateWeekAssignment] Updating with data:', updateData)
  
  const { data, error } = await supabase
    .from('week_assignments')
    // @ts-expect-error - Supabase type inference issue with Database type
    .update(updateData)
    .eq('id', assignmentId)
    .select()
    .single()
  
  if (error) {
    console.error('[updateWeekAssignment] Error:', error)
    throw error
  }
  
  console.log('[updateWeekAssignment] Updated data:', data)
  
  // Ensure returned dates are in YYYY-MM-DD format
  if (data) {
    const result = { ...(data as any) } as WeekAssignment
    if (result.start_date) {
      result.start_date = String(result.start_date).split(/[T\s]/)[0]
    }
    if (result.end_date) {
      result.end_date = String(result.end_date).split(/[T\s]/)[0]
    }
    console.log('[updateWeekAssignment] Formatted result dates:', {
      start_date: result.start_date,
      end_date: result.end_date,
    })
    return result
  }
  
  return data as WeekAssignment
}

export async function getUpcomingAssignments(groupId: string, excludeCurrentAssignmentId?: string): Promise<WeekAssignment[]> {
  const supabase = createClient() as SupabaseClient
  const today = new Date().toISOString().split('T')[0]
  
  let query = supabase
    .from('week_assignments')
    .select('*')
    .eq('group_id', groupId)
    .gte('start_date', today) // Only future assignments
    .order('start_date', { ascending: true })
  
  // Exclude current assignment if provided
  if (excludeCurrentAssignmentId) {
    query = query.neq('id', excludeCurrentAssignmentId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data || []
}

export async function getAllAssignments(groupId: string): Promise<WeekAssignment[]> {
  const supabase = createClient() as SupabaseClient
  
  const { data, error } = await supabase
    .from('week_assignments')
    .select('*')
    .eq('group_id', groupId)
    .order('start_date', { ascending: true })
  
  if (error) throw error
  
  // Format dates to YYYY-MM-DD
  return (data || []).map((assignment: any) => ({
    ...(assignment as any),
    start_date: String(assignment.start_date).split(/[T\s]/)[0],
    end_date: String(assignment.end_date).split(/[T\s]/)[0],
  })) as WeekAssignment[]
}

export async function getUpcomingAssignmentForUser(userId: string, groupId: string, daysAhead: number = 3): Promise<WeekAssignment | null> {
  const supabase = createClient() as SupabaseClient
  const today = new Date()
  const futureDate = new Date(today)
  futureDate.setDate(today.getDate() + daysAhead)
  const todayStr = today.toISOString().split('T')[0]
  const futureDateStr = futureDate.toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('week_assignments')
    .select('*')
    .eq('group_id', groupId)
    .eq('host_user_id', userId)
    .gte('start_date', todayStr)
    .lte('start_date', futureDateStr)
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle()
  
  if (error) throw error
  if (!data) return null
  
  // Format dates to YYYY-MM-DD
  const dataAny = data as any
  return {
    ...dataAny,
    start_date: String(dataAny.start_date).split(/[T\s]/)[0],
    end_date: String(dataAny.end_date).split(/[T\s]/)[0],
  } as WeekAssignment
}

export async function getChallengeForAssignment(assignmentId: string): Promise<{ challenge: WeekChallenge | null; exercises: StrengthExercise[] }> {
  const supabase = createClient() as SupabaseClient
  
  const { data: challengeData, error: challengeError } = await supabase
    .from('week_challenges')
    .select('*')
    .eq('week_assignment_id', assignmentId)
    .maybeSingle()
  
  if (challengeError) throw challengeError
  
  let exercises: StrengthExercise[] = []
  if (challengeData) {
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('strength_exercises')
      .select('*')
      .eq('week_challenge_id', (challengeData as any).id)
      .order('sort_order')
    
    if (exercisesError) throw exercisesError
    exercises = (exercisesData || []) as StrengthExercise[]
  }
  
  return {
    challenge: challengeData as WeekChallenge | null,
    exercises,
  }
}

export async function deleteWeekAssignment(assignmentId: string): Promise<void> {
  const supabase = createClient() as SupabaseClient
  const { error } = await supabase
    .from('week_assignments')
    .delete()
    .eq('id', assignmentId)
  
  if (error) throw error
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
  const supabase = createClient() as SupabaseClient
  // Create challenge
  const { data: challenge, error: challengeError } = await supabase
    .from('week_challenges')
    // @ts-expect-error - Supabase type inference issue with Database type
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
    week_challenge_id: (challenge as any).id,
    name: ex.name,
    target_reps: ex.targetReps,
    sort_order: idx + 1,
  }))
  
  const { data: exercisesData, error: exercisesError } = await supabase
    .from('strength_exercises')
    // @ts-expect-error - Supabase type inference issue with Database type
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
  const supabase = createClient() as SupabaseClient
  // Update challenge
  const { data: challenge, error: challengeError } = await supabase
    .from('week_challenges')
    // @ts-expect-error - Supabase type inference issue with Database type
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
    // @ts-expect-error - Supabase type inference issue with Database type
    .insert(exercisesToInsert)
    .select()
  
  if (exercisesError) throw exercisesError
  
  return { challenge, exercises: exercisesData || [] }
}

// Workout Logs
export async function getWorkoutLogs(weekChallengeId: string, userId?: string): Promise<WorkoutLog[]> {
  const supabase = createClient() as SupabaseClient
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
  const supabase = createClient() as SupabaseClient
  const { data, error } = await supabase
    .from('workout_logs')
    // @ts-expect-error - Supabase type inference issue with Database type
    .insert(log)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateWorkoutLog(logId: string, updates: Partial<WorkoutLog>): Promise<void> {
  const supabase = createClient() as SupabaseClient
  const { error } = await supabase
    .from('workout_logs')
    // @ts-expect-error - Supabase type inference issue with Database type
    .update(updates)
    .eq('id', logId)
  
  if (error) throw error
}

export async function deleteWorkoutLog(logId: string): Promise<void> {
  const supabase = createClient() as SupabaseClient
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
  const supabase = createClient() as SupabaseClient
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
  const cardioTotal = (logs as any[])
    ?.filter((log: any) => log.log_type === 'cardio')
    .reduce((sum: number, log: any) => sum + (log.cardio_amount || 0), 0) || 0
  
  const cardioProgress = Math.min(cardioTotal / (challenge as any).cardio_target, 1)
  
  const exerciseTotals: Record<string, number> = {}
  exercises?.forEach((ex: any) => {
    const total = (logs as any[])
      ?.filter((log: any) => log.log_type === 'strength' && log.exercise_id === ex.id)
      .reduce((sum: number, log: any) => sum + (log.strength_reps || 0), 0) || 0
    exerciseTotals[ex.id] = total
  })
  
  const strengthProgresses = exercises?.map((ex: any) => {
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
    ? (logs as any[]).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
    : undefined
  
  return {
    user_id: userId,
    display_name: (profile as any)?.display_name || 'Unknown',
    cardio_total: cardioTotal,
    cardio_progress: cardioProgress,
    strength_overall_progress: strengthOverallProgress,
    total_progress: totalProgress,
    last_activity_at: lastActivity,
    exercise_totals: exerciseTotals,
  }
}

export async function getLeaderboard(groupId: string): Promise<UserProgress[]> {
  const supabase = createClient() as SupabaseClient
  
  // First, get all current group members
  const { data: memberships, error: membershipError } = await supabase
    .from('group_memberships')
    .select('user_id')
    .eq('group_id', groupId)
  
  if (membershipError) throw membershipError
  if (!memberships || memberships.length === 0) return []
  
  const memberUserIds = (memberships as { user_id: string }[]).map(m => m.user_id)
  
  // Get active week to find the challenge
  const { data: activeWeek, error: weekError } = await supabase
    .from('v_active_week')
    .select('challenge_id')
    .eq('group_id', groupId)
    .maybeSingle()
  
  if (weekError) throw weekError
  if (!activeWeek || !(activeWeek as { challenge_id: string | null }).challenge_id) return []
  
  const challengeId = (activeWeek as { challenge_id: string }).challenge_id
  
  // Get challenge details
  const { data: challenge, error: challengeError } = await supabase
    .from('week_challenges')
    .select('*')
    .eq('id', challengeId)
    .single()
  
  if (challengeError || !challenge) return []
  
  // Get exercises
  const { data: exercises, error: exercisesError } = await supabase
    .from('strength_exercises')
    .select('*')
    .eq('week_challenge_id', challengeId)
    .order('sort_order')
  
  if (exercisesError) throw exercisesError
  
  // Type assertions for TypeScript
  const typedChallenge = challenge as any
  const typedExercises = (exercises || []) as any[]
  
  // Get all logs for all members
  const { data: allLogs, error: logsError } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('week_challenge_id', challengeId)
    .in('user_id', memberUserIds)
  
  if (logsError) throw logsError
  
  // Get profiles for display names
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', memberUserIds)
  
  if (profilesError) throw profilesError
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.display_name]))
  
  // Calculate progress for each member
  const progressList: UserProgress[] = memberUserIds.map(userId => {
    const userLogs = ((allLogs || []) as any[]).filter((log: any) => log.user_id === userId)
    
    // Calculate cardio progress
    const cardioTotal = userLogs
      .filter((log: any) => log.log_type === 'cardio')
      .reduce((sum: number, log: any) => sum + (log.cardio_amount || 0), 0)
    const cardioProgress = Math.min(cardioTotal / typedChallenge.cardio_target, 1)
    
    // Calculate strength progress (average across all exercises)
    const exerciseTotals: Record<string, number> = {}
    typedExercises.forEach((ex: any) => {
      const total = userLogs
        .filter((log: any) => log.log_type === 'strength' && log.exercise_id === ex.id)
        .reduce((sum: number, log: any) => sum + (log.strength_reps || 0), 0)
      exerciseTotals[ex.id] = total
    })
    
    const strengthProgresses = typedExercises.map((ex: any) => {
      const total = exerciseTotals[ex.id] || 0
      return Math.min(total / ex.target_reps, 1)
    })
    
    const strengthOverallProgress = strengthProgresses.length > 0
      ? strengthProgresses.reduce((sum, p) => sum + p, 0) / strengthProgresses.length
      : 0
    
    // Total progress is average of cardio and strength
    const totalProgress = (cardioProgress + strengthOverallProgress) / 2
    
    const lastActivity = userLogs.length > 0
      ? userLogs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
      : undefined
    
    return {
      user_id: userId,
      display_name: profileMap.get(userId) || 'Unknown',
      cardio_total: cardioTotal,
      cardio_progress: cardioProgress,
      strength_overall_progress: strengthOverallProgress,
      total_progress: totalProgress,
      last_activity_at: lastActivity,
      exercise_totals: exerciseTotals,
    }
  })
  
  // Sort by total progress
  return progressList.sort((a, b) => {
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

export async function getActivityFeed(groupId: string, limit: number = 5): Promise<ActivityFeedItem[]> {
  const supabase = createClient() as SupabaseClient
  const { data, error } = await supabase
    .from('v_activity_feed_active_week')
    .select('*')
    .eq('group_id', groupId)
    .limit(limit)
  
  if (error) throw error
  if (!data) return []
  
  return (data as any[]).map((row: any) => ({
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
