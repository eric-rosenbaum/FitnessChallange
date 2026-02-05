'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CardioMetric } from '@/types'
import { useApp } from '@/context/AppContext'
import { useUserGroup } from '@/lib/hooks/useUserGroup'
import { getActiveWeek, createWeekChallenge, updateWeekChallenge } from '@/lib/db/queries'
import LoadingSpinner from '@/components/LoadingSpinner'

interface ExerciseInput {
  id: string
  name: string
  targetReps: string
}

export default function CreateChallengePage() {
  const router = useRouter()
  const { user, challenge, setChallenge, exercises, setExercises } = useApp()
  const { group } = useUserGroup()
  const [activeWeek, setActiveWeek] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [cardioMetric, setCardioMetric] = useState<CardioMetric>('miles')
  const [cardioTarget, setCardioTarget] = useState('')
  const [exerciseInputs, setExerciseInputs] = useState<ExerciseInput[]>([
    { id: '1', name: '', targetReps: '' },
  ])
  
  // Fetch active week
  useEffect(() => {
    if (group) {
      getActiveWeek(group.id).then((week) => {
        setActiveWeek(week)
        setIsLoading(false)
      })
    }
  }, [group])
  
  // Initialize form with existing challenge if editing
  useEffect(() => {
    if (challenge) {
      setCardioMetric(challenge.cardio_metric)
      setCardioTarget(challenge.cardio_target.toString())
      if (exercises.length > 0) {
        setExerciseInputs(exercises.map((ex) => ({
          id: ex.id,
          name: ex.name,
          targetReps: ex.target_reps.toString(),
        })))
      }
    }
  }, [challenge, exercises])
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  if (!activeWeek) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl soft-shadow-lg p-6 text-center max-w-md border border-red-100/30">
          <p className="text-gray-700 mb-4 font-medium">No active week assignment found</p>
          <Link href="/" className="text-[#8B4513] hover:text-[#6B4423] hover:underline font-medium">Back to home</Link>
        </div>
      </div>
    )
  }
  
  const isHost = activeWeek.week_assignment.host_user_id === user?.id
  
  if (!isHost) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl soft-shadow-lg p-6 text-center max-w-md border border-red-100/30">
          <p className="text-gray-700 mb-4 font-medium">Only the weekly host can create challenges</p>
          <Link href="/" className="text-[#8B4513] hover:text-[#6B4423] hover:underline font-medium">Back to home</Link>
        </div>
      </div>
    )
  }
  
  const handleAddExercise = () => {
    setExerciseInputs([...exerciseInputs, { id: Date.now().toString(), name: '', targetReps: '' }])
  }
  
  const handleRemoveExercise = (id: string) => {
    if (exerciseInputs.length > 1) {
      setExerciseInputs(exerciseInputs.filter(ex => ex.id !== id))
    }
  }
  
  const handleExerciseChange = (id: string, field: 'name' | 'targetReps', value: string) => {
    if (field === 'name' && value.length > 50) {
      return // Max 50 characters
    }
    if (field === 'targetReps') {
      // Only allow numbers (including empty string for clearing)
      if (value && !/^\d+$/.test(value)) {
        return // Only numbers
      }
    }
    setExerciseInputs(exerciseInputs.map(ex =>
      ex.id === id ? { ...ex, [field]: value } : ex
    ))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!cardioTarget || parseFloat(cardioTarget) <= 0) {
      alert('Please enter a valid cardio target')
      return
    }
    
    if (exerciseInputs.some(ex => !ex.name.trim() || !ex.targetReps || parseInt(ex.targetReps) <= 0)) {
      alert('Please fill in all exercise fields with valid values')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      if (!user || !group) {
        throw new Error('User or group not found')
      }
      
      if (challenge) {
        // Update existing challenge
        const { challenge: updatedChallenge, exercises: updatedExercises } = await updateWeekChallenge(
          challenge.id,
          cardioMetric,
          parseFloat(cardioTarget),
          exerciseInputs.map(ex => ({
            name: ex.name.trim(),
            targetReps: parseInt(ex.targetReps),
          }))
        )
        setChallenge(updatedChallenge)
        setExercises(updatedExercises)
      } else {
        // Create new challenge
        const { challenge: newChallenge, exercises: newExercises } = await createWeekChallenge(
          group.id,
          activeWeek.week_assignment.id,
          user.id,
          cardioMetric,
          parseFloat(cardioTarget),
          exerciseInputs.map(ex => ({
            name: ex.name.trim(),
            targetReps: parseInt(ex.targetReps),
          }))
        )
        setChallenge(newChallenge)
        setExercises(newExercises)
      }
      
      router.push('/')
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to save challenge'))
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/')
  }
  
  const weekLabel = `Week of ${new Date(activeWeek.week_assignment.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="text-[#8B4513] hover:text-[#6B4423] hover:underline text-sm font-medium"
          >
            ← Back to home
          </button>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 tracking-tight">
            {challenge ? 'Edit Challenge' : 'Set Challenge'}
          </h1>
          <p className="text-sm text-gray-600 mt-1 font-medium">
            {weekLabel}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl soft-shadow-lg p-6 border border-red-100/30 space-y-6">
          {/* Cardio Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 tracking-tight">Cardio Goal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metric
                </label>
                <select
                  value={cardioMetric}
                  onChange={(e) => setCardioMetric(e.target.value as CardioMetric)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
                  style={{ fontSize: '16px' }}
                >
                  <option value="miles">Distance (Miles)</option>
                  <option value="minutes">Time (Hours/Minutes)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target {cardioMetric === 'miles' ? '(Miles)' : '(Minutes)'}
                </label>
                <input
                  type="number"
                  step={cardioMetric === 'miles' ? '0.1' : '1'}
                  min="0.1"
                  value={cardioTarget}
                  onChange={(e) => setCardioTarget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
                  style={{ fontSize: '16px' }}
                  placeholder={cardioMetric === 'miles' ? 'e.g., 20' : 'e.g., 300'}
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Strength Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 tracking-tight">Strength Exercises</h2>
              <button
                type="button"
                onClick={handleAddExercise}
                className="text-sm font-medium text-[#8B4513] hover:text-[#6B4423] px-3 py-1 rounded-lg hover:bg-green-50 transition-colors"
              >
                + Add Exercise
              </button>
            </div>
            <div className="space-y-3">
              {exerciseInputs.map((exercise) => (
                <div key={exercise.id} className="flex gap-3 items-start p-3 rounded-xl bg-white/30 border border-gray-200/50">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) => handleExerciseChange(exercise.id, 'name', e.target.value)}
                      maxLength={50}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
                      style={{ fontSize: '16px' }}
                      placeholder="Exercise name (e.g., Pushups)"
                      required
                    />
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={exercise.targetReps}
                      onChange={(e) => handleExerciseChange(exercise.id, 'targetReps', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
                      style={{ fontSize: '16px' }}
                      placeholder="Number of reps"
                      required
                    />
                  </div>
                  {exerciseInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(exercise.id)}
                      className="mt-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-gray-200/50">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-center font-medium transition-all"
            >
              <span className="text-xl">×</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-[#8B4513] text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed soft-shadow font-medium transition-all"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
