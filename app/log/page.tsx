'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { WorkoutLog, CardioActivity } from '@/types'
import {
  dummyCurrentUserId,
  getActiveWeek,
} from '@/lib/dummyData'
import { useApp } from '@/context/AppContext'

function LogPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editLogId = searchParams.get('edit')
  const { logs, updateLog, addLog } = useApp()
  const [activeTab, setActiveTab] = useState<'cardio' | 'strength'>('cardio')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const activeWeek = getActiveWeek()
  const editingLog = editLogId ? logs.find(log => log.id === editLogId && log.user_id === dummyCurrentUserId) : null
  
  // Form state
  const [cardioActivity, setCardioActivity] = useState<CardioActivity>('run')
  const [cardioAmount, setCardioAmount] = useState('')
  const [exerciseId, setExerciseId] = useState('')
  const [strengthReps, setStrengthReps] = useState('')
  const [loggedDate, setLoggedDate] = useState(new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  
  // Initialize form if editing
  useEffect(() => {
    if (editingLog) {
      setActiveTab(editingLog.log_type)
      setLoggedDate(editingLog.logged_at)
      setNote(editingLog.note || '')
      
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
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (editingLog) {
      // Update existing log
      updateLog(editingLog.id, {
        logged_at: loggedDate,
        note: note || undefined,
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
      const newLog: WorkoutLog = {
        id: `log-${Date.now()}`,
        group_id: activeWeek.week_assignment.group_id,
        week_challenge_id: activeWeek.challenge!.id,
        user_id: dummyCurrentUserId,
        logged_at: loggedDate,
        created_at: new Date().toISOString(),
        log_type: activeTab,
        ...(activeTab === 'cardio' ? {
          cardio_activity: cardioActivity,
          cardio_amount: parseFloat(cardioAmount),
        } : {
          exercise_id: exerciseId,
          strength_reps: parseInt(strengthReps),
        }),
        note: note || undefined,
      }
      addLog(newLog)
    }
    
    setIsSubmitting(false)
    router.push('/')
  }
  
  if (!activeWeek.challenge) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center max-w-md">
          <p className="text-gray-600 mb-4">No active challenge for this week</p>
          <Link href="/" className="text-blue-600 hover:underline">Back to home</Link>
        </div>
      </div>
    )
  }
  
  const metricLabel = activeWeek.challenge.cardio_metric === 'miles' ? 'Miles' : 'Minutes'
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline text-sm">← Back to home</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {editingLog ? 'Edit Workout' : 'Log Workout'}
          </h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('cardio')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'cardio'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cardio
            </button>
            <button
              onClick={() => setActiveTab('strength')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'strength'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Strength
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {activeTab === 'cardio' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Type
                  </label>
                  <select
                    value={cardioActivity}
                    onChange={(e) => setCardioActivity(e.target.value as CardioActivity)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select exercise</option>
                    {activeWeek.exercises.map(ex => (
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={loggedDate}
                onChange={(e) => setLoggedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a note about your workout..."
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Link
                href="/"
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
