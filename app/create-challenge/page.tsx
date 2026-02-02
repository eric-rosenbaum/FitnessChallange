'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CardioMetric } from '@/types'
import {
  dummyCurrentUserId,
  getActiveWeek,
  dummyWeekAssignment,
} from '@/lib/dummyData'

interface ExerciseInput {
  id: string
  name: string
  targetReps: string
}

export default function CreateChallengePage() {
  const router = useRouter()
  const activeWeek = getActiveWeek()
  const isHost = activeWeek.week_assignment.host_user_id === dummyCurrentUserId
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [startDate, setStartDate] = useState(activeWeek.week_assignment.start_date)
  const [endDate, setEndDate] = useState(activeWeek.week_assignment.end_date)
  const [cardioMetric, setCardioMetric] = useState<CardioMetric>('miles')
  const [cardioTarget, setCardioTarget] = useState('')
  const [exercises, setExercises] = useState<ExerciseInput[]>([
    { id: '1', name: '', targetReps: '' },
  ])
  
  if (!isHost) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center max-w-md">
          <p className="text-gray-600 mb-4">Only the weekly host can create challenges</p>
          <Link href="/" className="text-blue-600 hover:underline">Back to home</Link>
        </div>
      </div>
    )
  }
  
  const handleAddExercise = () => {
    setExercises([...exercises, { id: Date.now().toString(), name: '', targetReps: '' }])
  }
  
  const handleRemoveExercise = (id: string) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter(ex => ex.id !== id))
    }
  }
  
  const handleExerciseChange = (id: string, field: 'name' | 'targetReps', value: string) => {
    setExercises(exercises.map(ex =>
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
    
    if (exercises.some(ex => !ex.name || !ex.targetReps || parseInt(ex.targetReps) <= 0)) {
      alert('Please fill in all exercise fields with valid values')
      return
    }
    
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // In real app, this would create the challenge via API
    // For now, we'll just redirect
    alert('Challenge created! (This is dummy data - challenge already exists)')
    setIsSubmitting(false)
    router.push('/')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline text-sm">← Back to home</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Create Weekly Challenge</h1>
          <p className="text-sm text-gray-600 mt-1">
            Week: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Cardio Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cardio Goal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metric
                </label>
                <select
                  value={cardioMetric}
                  onChange={(e) => setCardioMetric(e.target.value as CardioMetric)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="miles">Miles</option>
                  <option value="minutes">Minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={cardioTarget}
                  onChange={(e) => setCardioTarget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 20"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Strength Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Strength Exercises</h2>
              <button
                type="button"
                onClick={handleAddExercise}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Exercise
              </button>
            </div>
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <div key={exercise.id} className="flex gap-3 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) => handleExerciseChange(exercise.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Exercise name (e.g., Pushups)"
                      required
                    />
                    <input
                      type="number"
                      min="1"
                      value={exercise.targetReps}
                      onChange={(e) => handleExerciseChange(exercise.id, 'targetReps', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Target reps"
                      required
                    />
                  </div>
                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(exercise.id)}
                      className="mt-2 px-3 py-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
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
              {isSubmitting ? 'Creating...' : 'Create Challenge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
