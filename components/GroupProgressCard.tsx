'use client'

import { useState, useEffect, useRef } from 'react'
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
    green: 'stroke-[#065f46] opacity-75',
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
            {progress >= 1.0 ? (
              <span className="text-5xl sm:text-6.5xl text-black font-bold">
                ✓
              </span>
            ) : (
              <span className="text-sm sm:text-lg font-bold text-gray-800">
                {Math.round(progress * 100)}%
              </span>
            )}
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
  const [showInfo, setShowInfo] = useState(false)
  const infoRefMobile = useRef<HTMLDivElement>(null)
  const infoRefDesktop = useRef<HTMLDivElement>(null)
  const weekLabel = new Date(weekStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  
  // Close info tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isOutsideMobile = infoRefMobile.current && !infoRefMobile.current.contains(target)
      const isOutsideDesktop = infoRefDesktop.current && !infoRefDesktop.current.contains(target)
      
      if (isOutsideMobile && isOutsideDesktop) {
        setShowInfo(false)
      }
    }
    
    if (showInfo) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showInfo])
  
  // Calculate days remaining
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(weekEndDate)
  endDate.setHours(23, 59, 59, 999)
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  
  // Calculate group cardio total (capped at 100% per person)
  // Group logs by user, calculate each user's total, cap at individual target, then sum
  const userCardioTotals: Record<string, number> = {}
  const cardioLogs = logs.filter(log => log.log_type === 'cardio' && log.cardio_amount && log.user_id)
  
  cardioLogs.forEach(log => {
    const userId = log.user_id!
    if (!userCardioTotals[userId]) {
      userCardioTotals[userId] = 0
    }
    userCardioTotals[userId] += log.cardio_amount || 0
  })
  
  // Cap each user's contribution at their individual target (100%)
  const individualCardioTarget = challenge.cardio_target
  const cappedUserCardioTotals: Record<string, number> = {}
  Object.keys(userCardioTotals).forEach(userId => {
    cappedUserCardioTotals[userId] = Math.min(userCardioTotals[userId], individualCardioTarget)
  })
  
  const groupCardioTotal = Object.values(cappedUserCardioTotals).reduce((sum, total) => sum + total, 0)
  
  // Group cardio target = individual target * number of members
  const groupCardioTarget = challenge.cardio_target * numberOfMembers
  const groupCardioProgress = groupCardioTarget > 0 ? Math.min(groupCardioTotal / groupCardioTarget, 1) : 0
  
  // Calculate group exercise totals (capped at 100% per person per exercise)
  const groupExerciseTotals: Record<string, number> = {}
  exercises.forEach(exercise => {
    // Group logs by user for this exercise
    const userExerciseTotals: Record<string, number> = {}
    const strengthLogs = logs.filter(log => 
      log.log_type === 'strength' && 
      log.exercise_id === exercise.id && 
      log.strength_reps && 
      log.user_id
    )
    
    strengthLogs.forEach(log => {
      const userId = log.user_id!
      if (!userExerciseTotals[userId]) {
        userExerciseTotals[userId] = 0
      }
      userExerciseTotals[userId] += log.strength_reps || 0
    })
    
    // Cap each user's contribution at their individual target (100%)
    const individualExerciseTarget = exercise.target_reps
    const cappedUserTotals: Record<string, number> = {}
    Object.keys(userExerciseTotals).forEach(userId => {
      cappedUserTotals[userId] = Math.min(userExerciseTotals[userId], individualExerciseTarget)
    })
    
    groupExerciseTotals[exercise.id] = Object.values(cappedUserTotals).reduce((sum, total) => sum + total, 0)
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
    totalLogs: logs.length,
    uniqueUsers: Array.from(new Set(logs.filter(log => log.user_id).map(log => log.user_id))),
    userCardioTotals,
    cappedUserCardioTotals,
    groupCardioTotal,
    individualTarget: challenge.cardio_target,
    groupCardioTarget,
    groupCardioProgress,
    cardioLogs: logs.filter(log => log.log_type === 'cardio').length,
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
    <div className="glass-card rounded-2xl soft-shadow-lg p-3 sm:p-5 mb-4 border border-red-100/30 relative">
      {/* Info icon - mobile: top right corner */}
      <div className="absolute top-3 right-3 sm:hidden" ref={infoRefMobile}>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Info about group progress calculation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
        {showInfo && (
          <div className="absolute right-0 top-6 z-10 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs text-gray-700">
            <p className="font-semibold mb-1">Group Progress Calculation</p>
            <p className="mb-2">Each person can contribute up to 100% of their individual goal. For example, if the goal is 10 miles per person and one person logs 50 miles, only 10 miles count toward the group total.</p>
            <button
              onClick={() => setShowInfo(false)}
              className="text-[#8B4513] hover:text-[#6B4423] font-medium"
            >
              Got it
            </button>
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-1 pr-8 sm:pr-0">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 tracking-tight">
          Group Progress (week of {weekLabel})
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
          </span>
          {/* Desktop: show info icon next to days left */}
          <div className="hidden sm:block relative" ref={infoRefDesktop}>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Info about group progress calculation"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            {showInfo && (
              <div className="absolute right-0 top-7 z-10 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-sm text-gray-700">
                <p className="font-semibold mb-1">Group Progress Calculation</p>
                <p className="mb-2">Each person can contribute up to 100% of their individual goal. For example, if the goal is 10 miles per person and one person logs 50 miles, only 10 miles count toward the group total.</p>
                <button
                  onClick={() => setShowInfo(false)}
                  className="text-[#8B4513] hover:text-[#6B4423] font-medium"
                >
                  Got it
                </button>
              </div>
            )}
          </div>
        </div>
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
