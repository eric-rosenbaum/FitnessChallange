'use client'

import type { UserProgress, StrengthExercise, WorkoutLog, WeekChallenge } from '@/types'
import Link from 'next/link'

interface ProgressCardProps {
  progress: UserProgress
  challenge: WeekChallenge
  exercises: StrengthExercise[]
  recentLogs: WorkoutLog[]
  onEditLog: (logId: string) => void
  onDeleteLog: (logId: string) => void
}

export default function ProgressCard({
  progress,
  challenge,
  exercises,
  recentLogs,
  onEditLog,
  onDeleteLog,
}: ProgressCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatLogDescription = (log: WorkoutLog) => {
    if (log.log_type === 'cardio') {
      const metric = challenge.cardio_metric === 'miles' 
        ? (log.cardio_amount === 1 ? 'mile' : 'miles')
        : (log.cardio_amount === 1 ? 'minute' : 'minutes')
      return `${log.cardio_activity} - ${log.cardio_amount} ${metric}`
    } else {
      const exercise = exercises.find(e => e.id === log.exercise_id)
      return `${exercise?.name || 'Exercise'} - ${log.strength_reps} reps`
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h2>
      
      {/* Cardio Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Cardio</span>
          <span className="text-sm text-gray-900">
            {progress.cardio_total.toFixed(1)} / {challenge.cardio_target} {challenge.cardio_metric}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all"
            style={{ width: `${Math.min(progress.cardio_progress * 100, 100)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {Math.round(progress.cardio_progress * 100)}% complete
        </div>
      </div>

      {/* Strength Overall Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Strength Overall</span>
          <span className="text-sm text-gray-900">
            {Math.round(progress.strength_overall_progress * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-green-600 h-2.5 rounded-full transition-all"
            style={{ width: `${Math.min(progress.strength_overall_progress * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Per-Exercise Progress */}
      <div className="mb-4 space-y-2">
        {exercises.map(exercise => {
          const total = progress.exercise_totals[exercise.id] || 0
          const progressValue = Math.min(total / exercise.target_reps, 1.0)
          return (
            <div key={exercise.id} className="text-sm">
              <div className="flex justify-between mb-0.5">
                <span className="text-gray-700">{exercise.name}:</span>
                <span className="text-gray-900">
                  {Math.round(total)} / {exercise.target_reps}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Logs */}
      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Your recent logs</h3>
        {recentLogs.length === 0 ? (
          <p className="text-sm text-gray-500">No logs yet. <Link href="/log" className="text-blue-600 hover:underline">Log your first workout</Link></p>
        ) : (
          <ul className="space-y-2">
            {recentLogs.map(log => (
              <li key={log.id} className="flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <span className="text-gray-900">{formatLogDescription(log)}</span>
                  <span className="text-gray-500 ml-2">{formatDate(log.logged_at)}</span>
                </div>
                <div className="flex gap-2 ml-2">
                  <button
                    onClick={() => onEditLog(log.id)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteLog(log.id)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
