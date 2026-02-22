'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { CardioActivity } from '@/types'
import { useApp } from '@/context/AppContext'
import { useUserGroup } from '@/lib/hooks/useUserGroup'
import { getActiveWeek, getActivePunishmentForUser } from '@/lib/db/queries'
import { createWorkoutLog, updateWorkoutLog, createPunishmentLog } from '@/lib/db/queries'
import { createClient } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

// Helper function to get today's date in local timezone (YYYY-MM-DD format)
// This prevents timezone issues where UTC date might be different from local date
function getLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function LogPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editLogId = searchParams.get('edit')
  const { user, logs, refreshLogs, challenge, exercises } = useApp()
  const { group, membership, isLoading: groupLoading } = useUserGroup()
  const [activeWeek, setActiveWeek] = useState<any>(null)
  const [isLoadingWeek, setIsLoadingWeek] = useState(true)
  const [activePunishment, setActivePunishment] = useState<any>(null)
  const [isLoggingPunishment, setIsLoggingPunishment] = useState(false)
  
  // Redirect spectators away from log page
  useEffect(() => {
    if (membership && membership.member_type === 'spectator') {
      router.push('/')
    }
  }, [membership, router])
  const [activeTab, setActiveTab] = useState<'cardio' | 'strength'>('cardio')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupabase(createClient())
    }
  }, [])
  
  const editingLog = editLogId ? logs.find(log => log.id === editLogId && log.user_id === user?.id) : null
  
  // Fetch active week and punishment
  useEffect(() => {
    if (group && user) {
      setIsLoadingWeek(true)
      Promise.all([
        getActiveWeek(group.id),
        getActivePunishmentForUser(user.id, group.id)
      ])
        .then(([week, punishment]) => {
          setActiveWeek(week)
          setActivePunishment(punishment)
          setIsLoadingWeek(false)
        })
        .catch((error) => {
          console.error('Error fetching data:', error)
          setIsLoadingWeek(false)
        })
    } else if (!groupLoading) {
      setIsLoadingWeek(false)
    }
  }, [group, groupLoading, user])
  
  // Form state
  const [cardioActivity, setCardioActivity] = useState<CardioActivity>('run')
  const [cardioAmount, setCardioAmount] = useState('')
  const [exerciseId, setExerciseId] = useState('')
  const [strengthReps, setStrengthReps] = useState('')
  const [loggedDate, setLoggedDate] = useState(getLocalDateString())
  
  // Initialize form if editing
  useEffect(() => {
    if (editingLog) {
      setActiveTab(editingLog.log_type)
      setLoggedDate(editingLog.logged_at)
      
      if (editingLog.log_type === 'cardio') {
        setCardioActivity(editingLog.cardio_activity || 'run')
        setCardioAmount(editingLog.cardio_amount?.toString() || '')
      } else {
        setExerciseId(editingLog.exercise_id || '')
        setStrengthReps(editingLog.strength_reps?.toString() || '')
      }
    }
  }, [editingLog])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !group) return
    if (!activeWeek?.challenge && !canLogPunishment) return
    
    setIsSubmitting(true)
    
    try {
      if (editingLog) {
        // Update existing log (always challenge log for editing)
        await updateWorkoutLog(editingLog.id, {
          logged_at: loggedDate,
          ...(activeTab === 'cardio' ? {
            cardio_activity: cardioActivity,
            cardio_amount: parseFloat(cardioAmount),
          } : {
            exercise_id: exerciseId,
            strength_reps: parseInt(strengthReps),
          }),
        })
      } else {
        // Determine which source to log to based on selected exercise
        if (activeTab === 'strength') {
          const selectedExercise = allExercises.find((ex: any) => ex.id === exerciseId)
          if (selectedExercise?.source === 'punishment' && activePunishment) {
            // Log to punishment
            await createPunishmentLog(
              group.id,
              activePunishment.punishment.id,
              user.id,
              loggedDate,
              'strength',
              undefined,
              undefined,
              exerciseId,
              parseInt(strengthReps)
            )
          } else if (activeWeek?.challenge) {
            // Log to challenge
            await createWorkoutLog({
              group_id: group.id,
              week_challenge_id: activeWeek.challenge.id,
              user_id: user.id,
              logged_at: loggedDate,
              log_type: 'strength',
              exercise_id: exerciseId,
              strength_reps: parseInt(strengthReps),
            })
          }
        } else {
          // Cardio: prefer challenge if it exists, otherwise punishment
          if (activeWeek?.challenge?.cardio_target) {
            await createWorkoutLog({
              group_id: group.id,
              week_challenge_id: activeWeek.challenge.id,
              user_id: user.id,
              logged_at: loggedDate,
              log_type: 'cardio',
              cardio_activity: cardioActivity,
              cardio_amount: parseFloat(cardioAmount),
            })
          } else if (activePunishment?.punishment.cardio_target) {
            await createPunishmentLog(
              group.id,
              activePunishment.punishment.id,
              user.id,
              loggedDate,
              'cardio',
              cardioActivity,
              parseFloat(cardioAmount)
            )
          }
        }
      }
      
      // Refresh logs if challenge exists
      if (activeWeek?.challenge) {
        await refreshLogs(activeWeek.challenge.id)
      }
      router.push('/')
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to save log'))
      setIsSubmitting(false)
    }
  }
  
  const handleSubmitPunishment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !group || !activePunishment) return
    
    // Validate that punishment has the selected option
    if (activeTab === 'cardio' && !activePunishment.punishment.cardio_target) {
      alert('This punishment does not have cardio targets')
      return
    }
    if (activeTab === 'strength') {
      const selectedExercise = allExercises.find((ex: any) => ex.id === exerciseId && ex.source === 'punishment')
      if (!selectedExercise) {
        alert('Please select a punishment exercise')
        return
      }
    }
    
    setIsLoggingPunishment(true)
    
    try {
      await createPunishmentLog(
        group.id,
        activePunishment.punishment.id,
        user.id,
        loggedDate,
        activeTab,
        activeTab === 'cardio' ? cardioActivity : undefined,
        activeTab === 'cardio' ? parseFloat(cardioAmount) : undefined,
        activeTab === 'strength' ? exerciseId : undefined,
        activeTab === 'strength' ? parseInt(strengthReps) : undefined
      )
      
      router.push('/')
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to save punishment log'))
      setIsLoggingPunishment(false)
    }
  }
  
  // Show loading state while fetching
  if (isLoadingWeek || groupLoading) {
    return <LoadingSpinner />
  }
  
  // Check if user has active punishment - if so, they can log punishment even without challenge
  const canLogPunishment = activePunishment && !editingLog
  
  if (!activeWeek?.challenge && !canLogPunishment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl soft-shadow-lg p-6 text-center max-w-md border border-red-100/30">
          <p className="text-gray-700 mb-4 font-medium">No active challenge for this week</p>
          <Link href="/" className="text-[#8B4513] hover:text-[#6B4423] hover:underline font-medium">Back to home</Link>
        </div>
      </div>
    )
  }
  
  // Combine exercises from both challenge and punishment
  const challengeExercises = exercises.length > 0 ? exercises : activeWeek?.exercises || []
  const punishmentExercises = activePunishment?.exercises || []
  
  // Combine all exercises, marking their source
  const allExercises = [
    ...challengeExercises.map((ex: any) => ({ ...ex, source: 'challenge' })),
    ...punishmentExercises.map((ex: any) => ({ ...ex, source: 'punishment' }))
  ]
  
  // Determine cardio metric label (prefer challenge if both exist, otherwise use whichever is available)
  const challengeCardioMetric = activeWeek?.challenge?.cardio_metric
  const punishmentCardioMetric = activePunishment?.punishment.cardio_metric
  const metricLabel = challengeCardioMetric
    ? (challengeCardioMetric === 'miles' ? 'Miles' : 'Minutes')
    : (punishmentCardioMetric === 'miles' ? 'Miles' : 'Minutes')
  
  // Determine if cardio/strength are available (from either source)
  const hasCardio = !!(activeWeek?.challenge?.cardio_target || activePunishment?.punishment.cardio_target)
  const hasStrength = allExercises.length > 0
  
  // If no cardio/strength available from either source, show message
  if (!hasCardio && !hasStrength && !activeWeek?.challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl soft-shadow-lg p-6 text-center max-w-md border border-red-100/30">
          <p className="text-gray-700 mb-4 font-medium">No exercises available</p>
          <Link href="/" className="text-[#8B4513] hover:text-[#6B4423] hover:underline font-medium">Back to home</Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6">
        <div className="mb-6">
          <Link href="/" className="text-[#8B4513] hover:text-[#6B4423] hover:underline text-sm font-medium">← Back to home</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 tracking-tight">
            {editingLog ? 'Edit Workout' : 'Log Workout'}
          </h1>
        </div>
        
        <div className="glass-card rounded-2xl soft-shadow-lg border border-red-100/30 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200/50">
            <button
              onClick={() => setActiveTab('cardio')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'cardio'
                  ? 'text-[#8B4513] border-b-2 border-[#8B4513]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cardio
            </button>
            <button
              onClick={() => setActiveTab('strength')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'strength'
                  ? 'text-[#8B4513] border-b-2 border-[#8B4513]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Strength
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-hidden">
            {activeTab === 'cardio' && hasCardio ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Type
                  </label>
                  <select
                    value={cardioActivity}
                    onChange={(e) => setCardioActivity(e.target.value as CardioActivity)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
                    style={{ height: '2.5rem', lineHeight: '1.5rem', fontSize: '16px' }}
                    required
                  >
                    <option value="run">Run</option>
                    <option value="walk">Walk</option>
                    <option value="bike">Bike</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {metricLabel}
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={cardioAmount}
                    onChange={(e) => setCardioAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
                    style={{ height: '2.5rem', lineHeight: '1.5rem', fontSize: '16px' }}
                    required
                  />
                </div>
              </>
            ) : activeTab === 'strength' && hasStrength ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exercise
                  </label>
                  <select
                    value={exerciseId}
                    onChange={(e) => setExerciseId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
                    style={{ height: '2.5rem', lineHeight: '1.5rem', fontSize: '16px' }}
                    required
                  >
                    <option value="">Select exercise</option>
                    {allExercises.map((ex: any) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}{ex.source === 'punishment' ? ' (Punishment)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reps
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={strengthReps}
                    onChange={(e) => setStrengthReps(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
                    style={{ height: '2.5rem', lineHeight: '1.5rem', fontSize: '16px' }}
                    required
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-600">
                {activeTab === 'cardio' ? 'Cardio is not available' : 'Strength exercises are not available'}
              </div>
            )}
            
            <div className="w-full overflow-hidden">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={loggedDate}
                onChange={(e) => setLoggedDate(e.target.value)}
                className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
                style={{ 
                  fontSize: '16px',
                  lineHeight: '1.5rem',
                  height: '2.5rem',
                  maxHeight: '2.5rem',
                  boxSizing: 'border-box',
                  width: '100%',
                  maxWidth: '100%',
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield',
                  paddingLeft: '12px',
                  paddingRight: '12px'
                }}
                required
              />
            </div>
            
            <div className="flex flex-col gap-3 pt-4">
              <div className="flex gap-3">
                <Link
                  href="/"
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-center font-medium"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-[#8B4513] text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed soft-shadow font-medium transition-all"
                >
                  {isSubmitting ? 'Saving...' : editingLog ? 'Update' : 'Log Workout'}
                </button>
              </div>
              {activePunishment && !editingLog && (
                <button
                  type="button"
                  onClick={handleSubmitPunishment}
                  disabled={isLoggingPunishment || isSubmitting}
                  className="w-full px-4 py-3 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed soft-shadow font-medium transition-all"
                  style={{ 
                    background: 'linear-gradient(to right, rgba(254, 226, 226, 0.9), rgba(254, 202, 202, 0.9))',
                    color: '#991b1b'
                  }}
                >
                  {isLoggingPunishment ? 'Saving...' : 'Log Punishment'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LogPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LogPageContent />
    </Suspense>
  )
}
