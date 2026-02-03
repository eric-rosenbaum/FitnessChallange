'use client'

import type { StrengthExercise, WeekChallenge, WorkoutLog } from '@/types'

interface GroupProgressCardProps {
  challenge: WeekChallenge
  exercises: StrengthExercise[]
  weekStartDate: string
  weekEndDate: string
  logs: WorkoutLog[]
  numberOfMembers: number
}

interface DonutChartProps {
  progress: number
  size?: number
  strokeWidth?: number
  color?: string
}

function DonutChart({ progress, size = 80, strokeWidth = 8, color = 'blue' }: DonutChartProps) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress * circumference)
  
  const colorClasses = {
    blue: 'stroke-blue-400 opacity-75',
    green: 'stroke-emerald-400 opacity-75',
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
          stroke="rgba(229, 231, 235, 0.5)"
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
            <span className="text-sm sm:text-lg font-bold text-gray-800">
              {Math.round(progress * 100)}%
            </span>
          </div>
    </div>
  )
}

export default function GroupProgressCard({
  challenge,
  exercises,
  weekStartDate,
  weekEndDate,
  logs,
  numberOfMembers,
}: GroupProgressCardProps) {
  const weekLabel = new Date(weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  
  // Calculate days remaining
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(weekEndDate)
  endDate.setHours(23, 59, 59, 999)
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  
  // Calculate group cardio total (sum of all users' cardio)
  const groupCardioTotal = logs
    .filter(log => log.log_type === 'cardio' && log.cardio_amount)
    .reduce((sum, log) => sum + (log.cardio_amount || 0), 0)
  
  // Group cardio target = individual target * number of members
  const groupCardioTarget = challenge.cardio_target * numberOfMembers
  const groupCardioProgress = groupCardioTarget > 0 ? Math.min(groupCardioTotal / groupCardioTarget, 1) : 0
  
  // Calculate group exercise totals (sum of all users' reps per exercise)
  const groupExerciseTotals: Record<string, number> = {}
  exercises.forEach(exercise => {
    const total = logs
      .filter(log => log.log_type === 'strength' && log.exercise_id === exercise.id && log.strength_reps)
      .reduce((sum, log) => sum + (log.strength_reps || 0), 0)
    groupExerciseTotals[exercise.id] = total
  })
  
  // Calculate strength overall progress (average across exercises)
  // Group target for each exercise = individual target * number of members
  const strengthProgresses = exercises.map(exercise => {
    const total = groupExerciseTotals[exercise.id] || 0
    const groupTarget = exercise.target_reps * numberOfMembers
    return groupTarget > 0 ? Math.min(total / groupTarget, 1) : 0
  })
  const groupStrengthProgress = strengthProgresses.length > 0
    ? strengthProgresses.reduce((sum, p) => sum + p, 0) / strengthProgresses.length
    : 0
  
  // Debug logging (after all calculations)
  console.log('[GroupProgressCard]', {
    numberOfMembers,
    groupCardioTotal,
    individualTarget: challenge.cardio_target,
    groupCardioTarget,
    groupCardioProgress,
    totalLogs: logs.length,
    cardioLogs: logs.filter(log => log.log_type === 'cardio').length,
    uniqueUsers: new Set(logs.map(log => log.user_id)).size,
    exerciseTotals: groupExerciseTotals,
    groupStrengthProgress,
  })
  
  // Calculate cardio breakdown by activity type
  const cardioBreakdown: Record<string, number> = {}
  logs
    .filter(log => log.log_type === 'cardio' && log.cardio_activity && log.cardio_amount)
    .forEach(log => {
      const activity = log.cardio_activity!
      const capitalized = activity.charAt(0).toUpperCase() + activity.slice(1)
      cardioBreakdown[capitalized] = (cardioBreakdown[capitalized] || 0) + (log.cardio_amount || 0)
    })
  
  return (
    <div className="glass-card rounded-2xl soft-shadow-lg p-3 sm:p-5 mb-4 border border-white/50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-1">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 tracking-tight">
          Group Progress (week of {weekLabel})
        </h2>
        <span className="text-xs sm:text-sm text-gray-600 font-medium">
          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
        </span>
      </div>
      
      {/* Cardio and Strength side by side */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {/* Cardio Progress */}
        <div className="flex flex-col items-center">
          <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1 sm:mb-2 tracking-wide">Cardio</div>
          <DonutChart
            progress={groupCardioProgress}
            size={140}
            strokeWidth={20}
            color="green"
          />
          <div className="text-xs sm:text-sm font-medium text-gray-800 mt-1 sm:mt-2 text-center mb-2 sm:mb-3">
            {groupCardioTotal.toFixed(1)} / {groupCardioTarget.toFixed(1)} {challenge.cardio_metric === 'miles' ? 'mi' : 'min'}
          </div>
          {/* Cardio Breakdown */}
          <div className="w-full space-y-0.5 sm:space-y-1 text-center">
            {Object.entries(cardioBreakdown).map(([activity, amount]) => (
              <div key={activity} className="text-[10px] sm:text-xs text-gray-600 font-medium">
                {activity}: {amount.toFixed(1)} {challenge.cardio_metric === 'miles' ? 'mi' : 'min'}
              </div>
            ))}
          </div>
        </div>

        {/* Strength Overall Progress */}
        <div className="flex flex-col items-center">
          <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1 sm:mb-2 tracking-wide">Strength</div>
          <DonutChart
            progress={groupStrengthProgress}
            size={140}
            strokeWidth={20}
            color="blue"
          />
          <div className="text-xs sm:text-sm font-medium text-gray-800 mt-1 sm:mt-2 text-center mb-2 sm:mb-3">
            {Math.round(groupStrengthProgress * 100)}% complete
          </div>
          {/* Exercise List */}
          <div className="w-full space-y-0.5 sm:space-y-1 text-center">
            {exercises.map(exercise => {
              const total = groupExerciseTotals[exercise.id] || 0
              const groupTarget = exercise.target_reps * numberOfMembers
              return (
                <div key={exercise.id} className="text-[10px] sm:text-xs text-gray-600 font-medium">
                  {exercise.name}: {Math.round(total)} / {Math.round(groupTarget)}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
