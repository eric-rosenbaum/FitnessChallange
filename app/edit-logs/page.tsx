'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import StickyTopBar from '@/components/StickyTopBar'
import { useApp } from '@/context/AppContext'
import { useUserGroup } from '@/lib/hooks/useUserGroup'
import { getActiveWeek } from '@/lib/db/queries'
import { updateWorkoutLog, deleteWorkoutLog } from '@/lib/db/queries'
import type { WorkoutLog, StrengthExercise } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'

function EditLogsPageContent() {
  const { user, logs, refreshLogs, challenge, exercises } = useApp()
  const { group, isLoading: groupLoading } = useUserGroup()
  const [activeWeek, setActiveWeek] = useState<any>(null)
  const [isLoadingWeek, setIsLoadingWeek] = useState(true)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

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

  // Get user's logs for the current challenge
  const userLogs = logs.filter(log => 
    log.user_id === user?.id && 
    log.week_challenge_id === challenge?.id
  ).sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())

  const handleStartEdit = (log: WorkoutLog) => {
    setEditingLogId(log.id)
    if (log.log_type === 'cardio') {
      setEditAmount(log.cardio_amount?.toString() || '')
    } else {
      setEditAmount(log.strength_reps?.toString() || '')
    }
  }

  const handleCancelEdit = () => {
    setEditingLogId(null)
    setEditAmount('')
  }

  const handleSaveEdit = async (log: WorkoutLog) => {
    if (!challenge || !user) return
    
    setIsSaving(true)
    try {
      if (log.log_type === 'cardio') {
        await updateWorkoutLog(log.id, {
          cardio_amount: parseFloat(editAmount)
        })
      } else {
        await updateWorkoutLog(log.id, {
          strength_reps: parseInt(editAmount)
        })
      }
      await refreshLogs(challenge.id)
      setEditingLogId(null)
      setEditAmount('')
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to update log'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return
    if (!challenge) return
    
    setIsDeleting(logId)
    try {
      await deleteWorkoutLog(logId)
      await refreshLogs(challenge.id)
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to delete log'))
    } finally {
      setIsDeleting(null)
    }
  }

  const getExerciseName = (exerciseId: string): string => {
    const currentExercises = exercises.length > 0 ? exercises : (activeWeek?.exercises || [])
    const exercise = currentExercises.find((ex: StrengthExercise) => ex.id === exerciseId)
    return exercise?.name || 'Unknown'
  }

  if (isLoadingWeek || groupLoading) {
    return (
      <div className="min-h-screen">
        <StickyTopBar />
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
          <LoadingSpinner fullScreen={false} />
        </div>
      </div>
    )
  }

  if (!activeWeek?.challenge) {
    return (
      <div className="min-h-screen">
        <StickyTopBar />
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
          <div className="glass-card rounded-2xl soft-shadow-lg p-6 text-center max-w-md border border-red-100/30">
            <p className="text-gray-700 mb-4 font-medium">No active challenge for this week</p>
            <Link href="/" className="text-[#8B4513] hover:text-[#6B4423] hover:underline font-medium">Back to home</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <StickyTopBar 
        challengeCreatedBy={activeWeek?.challenge ? activeWeek.host_name : undefined}
      />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/" className="text-[#8B4513] hover:text-[#6B4423] hover:underline text-sm font-medium">← Back to home</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 tracking-tight">Edit Your Logs</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your workout logs for this week</p>
        </div>

        {userLogs.length === 0 ? (
          <div className="glass-card rounded-2xl soft-shadow-lg p-8 text-center border border-red-100/30">
            <p className="text-gray-700 mb-4 font-medium">You haven't logged any workouts yet</p>
            <Link
              href="/log"
              className="inline-block px-6 py-3 bg-[#8B4513] text-white rounded-xl hover:opacity-90 transition-all soft-shadow font-medium"
            >
              Log a Workout
            </Link>
          </div>
        ) : (
          <div className="glass-card rounded-2xl soft-shadow-lg border border-red-100/30 overflow-hidden">
            <div className="divide-y divide-gray-200/50">
              {userLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-white/30 transition-colors">
                  {editingLogId === log.id ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          {log.log_type === 'cardio' ? (
                            <>
                              {log.cardio_activity?.charAt(0).toUpperCase()}{log.cardio_activity?.slice(1)} - {new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </>
                          ) : (
                            <>
                              {getExerciseName(log.exercise_id || '')} - {new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step={log.log_type === 'cardio' ? 'any' : '1'}
                            min="0"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50 text-sm w-24"
                            placeholder={log.log_type === 'cardio' ? 'Amount' : 'Reps'}
                          />
                          <span className="text-sm text-gray-600">
                            {log.log_type === 'cardio' 
                              ? (activeWeek.challenge.cardio_metric === 'miles' ? 'miles' : 'minutes')
                              : 'reps'
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveEdit(log)}
                          disabled={isSaving || !editAmount}
                          className="px-3 py-1.5 bg-[#8B4513] text-white text-sm rounded-lg hover:bg-[#6B4423] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-semibold text-gray-800">
                            {log.log_type === 'cardio' ? (
                              <>
                                {log.cardio_activity?.charAt(0).toUpperCase()}{log.cardio_activity?.slice(1)}
                              </>
                            ) : (
                              <>
                                {getExerciseName(log.exercise_id || '')}
                              </>
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-600">
                            {log.log_type === 'cardio' 
                              ? `${log.cardio_amount?.toFixed(1)} ${activeWeek.challenge.cardio_metric === 'miles' ? 'mi' : 'min'}`
                              : `${log.strength_reps} reps`
                            }
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.logged_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        {log.note && (
                          <div className="text-xs text-gray-500 mt-1 italic">
                            "{log.note}"
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(log)}
                          className="px-3 py-1.5 text-[#8B4513] hover:text-[#6B4423] hover:bg-green-50/50 text-sm rounded-lg font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          disabled={isDeleting === log.id}
                          className="px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50/50 text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          {isDeleting === log.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function EditLogsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <EditLogsPageContent />
    </Suspense>
  )
}
