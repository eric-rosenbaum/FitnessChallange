'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  
  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const totalMinutes = Math.floor(totalSeconds / 60)
    const totalHours = Math.floor(totalMinutes / 60)
    const totalDays = Math.floor(totalHours / 24)
    
    if (totalHours < 1) {
      // Less than 1 hour: show minutes and seconds
      const minutes = totalMinutes
      const seconds = totalSeconds % 60
      if (minutes > 0) {
        return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ${seconds} ${seconds === 1 ? 'sec' : 'secs'}`
      } else {
        return `${seconds} ${seconds === 1 ? 'sec' : 'secs'}`
      }
    } else if (totalDays < 1) {
      // Less than 1 day: show hours and minutes
      const hours = totalHours
      const minutes = totalMinutes % 60
      if (minutes > 0) {
        return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ${minutes} ${minutes === 1 ? 'min' : 'mins'}`
      } else {
        return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`
      }
    } else {
      // 1 day or more: show days and hours
      const days = totalDays
      const hours = totalHours % 24
      if (hours > 0) {
        return `${days} ${days === 1 ? 'day' : 'days'} ${hours} ${hours === 1 ? 'hr' : 'hrs'}`
      } else {
        return `${days} ${days === 1 ? 'day' : 'days'}`
      }
    }
  }
  
  // Calculate time remaining with real-time updates
  const [timeRemainingText, setTimeRemainingText] = useState('')
  
  useEffect(() => {
    // Parse end date as local time to avoid timezone issues
    // Extract YYYY-MM-DD from the date string
    const dateMatch = weekEndDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
    let endDate: Date
    if (dateMatch) {
      const [, year, month, day] = dateMatch
      // Create date in local timezone (not UTC) to avoid day shift
      endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999)
    } else {
      // Fallback: try standard parsing
      endDate = new Date(weekEndDate)
      endDate.setHours(23, 59, 59, 999)
    }
    
    const updateTime = () => {
      const now = new Date()
      const timeRemainingMs = Math.max(0, endDate.getTime() - now.getTime())
      setTimeRemainingText(formatTimeRemaining(timeRemainingMs))
    }
    
    // Update immediately
    updateTime()
    
    // Update interval based on time remaining
    const timeRemainingMs = Math.max(0, endDate.getTime() - new Date().getTime())
    const totalHours = Math.floor(timeRemainingMs / (1000 * 60 * 60))
    const interval = totalHours < 1 ? 1000 : 60000 // Update every second if < 1 hour, else every minute
    
    const intervalId = setInterval(updateTime, interval)
    
    return () => clearInterval(intervalId)
  }, [weekEndDate])
  
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
    <div className="glass-card rounded-2xl soft-shadow-lg p-3 sm:p-5 mb-4 border border-red-100/30">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-1">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 tracking-tight">
          Your Progress (week of {weekLabel})
        </h2>
        <span className="text-xs sm:text-sm text-gray-600 font-medium">
          {timeRemainingText} left
        </span>
      </div>
      
      {/* Cardio and Strength side by side */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {/* Cardio Progress */}
        <div className="flex flex-col items-center">
          <div className="text-xs sm:text-sm font-semibold text-gray-800 mb-1 sm:mb-2 tracking-wide">Cardio</div>
          <DonutChart
            progress={progress.cardio_progress}
            size={140}
            strokeWidth={20}
            color="green"
          />
          <div className="text-xs sm:text-sm font-medium text-gray-800 mt-1 sm:mt-2 text-center mb-2 sm:mb-3">
            {progress.cardio_total.toFixed(1)} / {challenge.cardio_target} {challenge.cardio_metric === 'miles' ? 'mi' : 'min'}
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
            progress={progress.strength_overall_progress}
            size={140}
            strokeWidth={20}
            color="blue"
          />
          <div className="text-xs sm:text-sm font-medium text-gray-800 mt-1 sm:mt-2 text-center mb-2 sm:mb-3">
            {Math.round(progress.strength_overall_progress * 100)}% complete
          </div>
          {/* Exercise List */}
          <div className="w-full space-y-0.5 sm:space-y-1 text-center">
            {exercises.map(exercise => {
              const total = progress.exercise_totals[exercise.id] || 0
              return (
                <div key={exercise.id} className="text-[10px] sm:text-xs text-gray-600 font-medium">
                  {exercise.name}: {Math.round(total)} / {exercise.target_reps}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Edit Logs Button - Bottom Right */}
      <div className="flex justify-end mt-2 sm:mt-3">
        <Link
          href="/edit-logs"
          className="text-[10px] sm:text-xs text-[#8B4513] hover:text-[#6B4423] hover:underline font-medium flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 sm:h-4 sm:w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit logs
        </Link>
      </div>
    </div>
  )
}
