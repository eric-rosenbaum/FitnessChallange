'use client'

import { useState } from 'react'
import type { UserProgress, WorkoutLog, StrengthExercise, WeekChallenge } from '@/types'

interface LeaderboardProps {
  progressList: UserProgress[]
  currentUserId: string
  logs: WorkoutLog[]
  exercises: StrengthExercise[]
  challenge: WeekChallenge
}

export default function Leaderboard({ progressList, currentUserId, logs, exercises, challenge }: LeaderboardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Get top 3
  const top3 = progressList.slice(0, 3)
  
  // Get current user's position and data
  const currentUserIndex = progressList.findIndex(p => p.user_id === currentUserId)
  const currentUser = progressList[currentUserIndex]
  const showCurrentUser = currentUserIndex >= 3 // Only show separately if not in top 3
  
  // Determine what to show
  const displayList = isExpanded ? progressList : top3
  const hasMore = progressList.length > 3

  // Calculate breakdown for a user
  const getUserBreakdown = (userId: string): string => {
    const userLogs = logs.filter(log => log.user_id === userId)
    
    // Calculate cardio total
    const cardioTotal = userLogs
      .filter(log => log.log_type === 'cardio' && log.cardio_amount)
      .reduce((sum, log) => sum + (log.cardio_amount || 0), 0)
    
    // Calculate exercise totals
    const exerciseTotals: Record<string, number> = {}
    userLogs
      .filter(log => log.log_type === 'strength' && log.exercise_id && log.strength_reps)
      .forEach(log => {
        const exId = log.exercise_id!
        exerciseTotals[exId] = (exerciseTotals[exId] || 0) + (log.strength_reps || 0)
      })
    
    // Build breakdown string
    const parts: string[] = []
    
    // Cardio
    if (cardioTotal > 0) {
      const metric = challenge.cardio_metric === 'miles' ? 'mi' : 'min'
      parts.push(`Cardio: ${cardioTotal.toFixed(1)} ${metric}`)
    }
    
    // Exercises
    exercises.forEach(exercise => {
      const total = exerciseTotals[exercise.id] || 0
      if (total > 0) {
        parts.push(`${exercise.name}: ${Math.round(total)}`)
      }
    })
    
    return parts.join('       ')
  }

  return (
    <div className="glass-card rounded-2xl soft-shadow-lg p-3 sm:p-5 mb-4 border border-red-100/30">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 tracking-tight">Leaderboard</h2>
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs sm:text-sm font-medium text-[#8B4513] hover:text-[#6B4423] transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>
      
          <div className="space-y-2 sm:space-y-3">
            {displayList.map((progress, index) => (
              <div
                key={progress.user_id}
                className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl transition-all ${
                  progress.user_id === currentUserId 
                    ? 'bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200/50' 
                    : 'hover:bg-gray-50/50'
                }`}
              >
                <div className="flex-shrink-0 w-6 sm:w-8 text-center font-semibold text-gray-700 text-xs sm:text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {progress.display_name}
                    {progress.user_id === currentUserId && ' (You)'}
                  </div>
                  <div className="w-full bg-gray-200/50 rounded-full h-2 sm:h-2.5 mt-1 sm:mt-1.5 overflow-hidden">
                    <div
                      className="gradient-green-translucent h-2 sm:h-2.5 rounded-full transition-all"
                      style={{ width: `${Math.min(progress.total_progress * 100, 100)}%` }}
                    />
                  </div>
                  {getUserBreakdown(progress.user_id) && (
                    <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">
                      {getUserBreakdown(progress.user_id)}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 text-xs sm:text-sm font-medium text-gray-700">
                  {Math.round(progress.total_progress * 100)}%
                </div>
              </div>
            ))}
        
        {!isExpanded && showCurrentUser && currentUser && (
          <>
            <div className="border-t border-gray-200 my-2"></div>
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200/50">
              <div className="flex-shrink-0 w-6 sm:w-8 text-center font-semibold text-gray-700 text-xs sm:text-sm">
                {currentUserIndex + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {currentUser.display_name} (You)
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 mt-1 sm:mt-1.5">
                  <div
                    className="gradient-green-translucent h-2 sm:h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min(currentUser.total_progress * 100, 100)}%` }}
                  />
                </div>
                {getUserBreakdown(currentUser.user_id) && (
                  <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">
                    {getUserBreakdown(currentUser.user_id)}
                  </div>
                )}
              </div>
              <div className="flex-shrink-0 text-xs sm:text-sm font-medium text-gray-700">
                {Math.round(currentUser.total_progress * 100)}%
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
