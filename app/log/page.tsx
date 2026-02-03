'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { CardioActivity } from '@/types'
import { useApp } from '@/context/AppContext'
import { useUserGroup } from '@/lib/hooks/useUserGroup'
import { getActiveWeek } from '@/lib/db/queries'
import { createWorkoutLog, updateWorkoutLog } from '@/lib/db/queries'
import { createClient } from '@/lib/supabase/client'

function LogPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editLogId = searchParams.get('edit')
  const { user, logs, refreshLogs, challenge, exercises } = useApp()
  const { group, isLoading: groupLoading } = useUserGroup()
  const [activeWeek, setActiveWeek] = useState<any>(null)
  const [isLoadingWeek, setIsLoadingWeek] = useState(true)
  const [activeTab, setActiveTab] = useState<'cardio' | 'strength'>('cardio')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupabase(createClient())
    }
  }, [])
  
  const editingLog = editLogId ? logs.find(log => log.id === editLogId && log.user_id === user?.id) : null
  
  // Fetch active week
  useEffect(() => {
    if (group) {
      setIsLoadingWeek(true)
      getActiveWeek(group.id)
        .then((week) => {
          setActiveWeek(week)
          setIsLoadingWeek(false)
        })
        .catch((error) => {
          console.error('Error fetching active week:', error)
          setIsLoadingWeek(false)
        })
    } else if (!groupLoading) {
      setIsLoadingWeek(false)
    }
  }, [group, groupLoading])
  
  // Form state
  const [cardioActivity, setCardioActivity] = useState<CardioActivity>('run')
  const [cardioAmount, setCardioAmount] = useState('')
  const [exerciseId, setExerciseId] = useState('')
  const [strengthReps, setStrengthReps] = useState('')
  const [loggedDate, setLoggedDate] = useState(new Date().toISOString().split('T')[0])
  
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
    if (!user || !group || !activeWeek?.challenge) return
    
    setIsSubmitting(true)
    
    try {
      if (editingLog) {
        // Update existing log
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
        // Create new log
        await createWorkoutLog({
          group_id: group.id,
          week_challenge_id: activeWeek.challenge.id,
          user_id: user.id,
          logged_at: loggedDate,
          log_type: activeTab,
          ...(activeTab === 'cardio' ? {
            cardio_activity: cardioActivity,
            cardio_amount: parseFloat(cardioAmount),
          } : {
            exercise_id: exerciseId,
            strength_reps: parseInt(strengthReps),
          }),
        })
      }
      
      // Refresh logs
      await refreshLogs(activeWeek.challenge.id)
      router.push('/')
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to save log'))
      setIsSubmitting(false)
    }
  }
  
  // Show loading state while fetching
  if (isLoadingWeek || groupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl soft-shadow-lg p-6 text-center max-w-md border border-white/50">
          <p className="text-gray-700 mb-4 font-medium">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Show error/empty state only after loading is complete
  if (!activeWeek?.challenge) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl soft-shadow-lg p-6 text-center max-w-md border border-white/50">
          <p className="text-gray-700 mb-4 font-medium">No active challenge for this week</p>
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium">Back to home</Link>
        </div>
      </div>
    )
  }
  
  const metricLabel = activeWeek.challenge.cardio_metric === 'miles' ? 'Miles' : 'Minutes'
  const currentExercises = exercises.length > 0 ? exercises : activeWeek.exercises
  
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6">
        <div className="mb-6">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 hover:underline text-sm font-medium">← Back to home</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 tracking-tight">
            {editingLog ? 'Edit Workout' : 'Log Workout'}
          </h1>
        </div>
        
        <div className="glass-card rounded-2xl soft-shadow-lg border border-white/50 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200/50">
            <button
              onClick={() => setActiveTab('cardio')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'cardio'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cardio
            </button>
            <button
              onClick={() => setActiveTab('strength')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'strength'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Strength
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-hidden">
            {activeTab === 'cardio' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Type
                  </label>
                  <select
                    value={cardioActivity}
                    onChange={(e) => setCardioActivity(e.target.value as CardioActivity)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 text-sm"
                    style={{ height: '2.5rem', lineHeight: '1.5rem' }}
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
                    step="0.1"
                    min="0"
                    value={cardioAmount}
                    onChange={(e) => setCardioAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 text-sm"
                    style={{ height: '2.5rem', lineHeight: '1.5rem' }}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exercise
                  </label>
                  <select
                    value={exerciseId}
                    onChange={(e) => setExerciseId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 text-sm"
                    style={{ height: '2.5rem', lineHeight: '1.5rem' }}
                    required
                  >
                    <option value="">Select exercise</option>
                    {currentExercises.map((ex: any) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 text-sm"
                    style={{ height: '2.5rem', lineHeight: '1.5rem' }}
                    required
                  />
                </div>
              </>
            )}
            
            <div className="w-full overflow-hidden">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={loggedDate}
                onChange={(e) => setLoggedDate(e.target.value)}
                className="w-full min-w-0 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 text-sm"
                style={{ 
                  fontSize: '14px',
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
            
            <div className="flex gap-3 pt-4">
              <Link
                href="/"
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-center font-medium"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 gradient-green-translucent text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed soft-shadow font-medium transition-all"
              >
                {isSubmitting ? 'Saving...' : editingLog ? 'Update' : 'Log Workout'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <LogPageContent />
    </Suspense>
  )
}
