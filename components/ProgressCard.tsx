'use client'

import type { UserProgress, StrengthExercise, WeekChallenge, WorkoutLog, CardioActivity } from '@/types'

interface ProgressCardProps {
  progress: UserProgress
  challenge: WeekChallenge
  exercises: StrengthExercise[]
  weekStartDate: string
  weekEndDate: string
  logs: WorkoutLog[]
  userId: string
}

interface DonutChartProps {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
}

function DonutChart({ progress, size = 80, strokeWidth = 8, color = 'blue' }: DonutChartProps) {
  // Smaller inner radius = thicker ring
  // Use a larger strokeWidth relative to size for thicker rings
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress * circumference)
  
  const colorClasses = {
    blue: 'stroke-blue-500 opacity-70',
    green: 'stroke-green-500 opacity-70',
  }
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-base font-semibold text-gray-900">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  )
}

export default function ProgressCard({
  progress,
  challenge,
  exercises,
  weekStartDate,
  weekEndDate,
  logs,
  userId,
}: ProgressCardProps) {
  const weekLabel = new Date(weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  
  // Calculate days remaining
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(weekEndDate)
  endDate.setHours(23, 59, 59, 999)
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  
  // Calculate cardio breakdown
  const userCardioLogs = logs.filter(log => 
    log.user_id === userId && 
    log.log_type === 'cardio' && 
    log.cardio_activity && 
    log.cardio_amount
  )
  
  const cardioBreakdown: Record<string, number> = {}
  userCardioLogs.forEach(log => {
    const activity = log.cardio_activity!
    const capitalized = activity.charAt(0).toUpperCase() + activity.slice(1)
    cardioBreakdown[capitalized] = (cardioBreakdown[capitalized] || 0) + (log.cardio_amount || 0)
  })
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Your Progress (week of {weekLabel})
        </h2>
        <span className="text-sm text-gray-600">
          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left in week
        </span>
      </div>
      
      {/* Cardio and Strength side by side */}
      <div className="grid grid-cols-2 gap-2">
        {/* Cardio Progress */}
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium text-gray-700 mb-1">Cardio</div>
          <DonutChart
            progress={progress.cardio_progress}
            size={200}
            strokeWidth={28}
            color="green"
          />
          <div className="text-sm text-gray-900 mt-1 text-center mb-2">
            {progress.cardio_total.toFixed(1)} / {challenge.cardio_target} {challenge.cardio_metric}
          </div>
          {/* Cardio Breakdown */}
          <div className="w-full space-y-0.5 text-center">
            {Object.entries(cardioBreakdown).map(([activity, amount]) => (
              <div key={activity} className="text-xs text-gray-700">
                {activity}: {amount.toFixed(1)} {challenge.cardio_metric === 'miles' ? 'mi' : 'min'}
              </div>
            ))}
          </div>
        </div>

        {/* Strength Overall Progress */}
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium text-gray-700 mb-1">Strength Overall</div>
          <DonutChart
            progress={progress.strength_overall_progress}
            size={200}
            strokeWidth={28}
            color="blue"
          />
          <div className="text-sm text-gray-900 mt-1 text-center mb-2">
            {Math.round(progress.strength_overall_progress * 100)}% complete
          </div>
          {/* Exercise List */}
          <div className="w-full space-y-0.5 text-center">
            {exercises.map(exercise => {
              const total = progress.exercise_totals[exercise.id] || 0
              return (
                <div key={exercise.id} className="text-xs text-gray-700">
                  {exercise.name}: {Math.round(total)} / {exercise.target_reps}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
