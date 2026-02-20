'use client'

import { useState } from 'react'
import type { PunishmentProgress, PunishmentLog, PunishmentExercise, Punishment } from '@/types'

interface PunishmentLeaderboardProps {
  progressList: PunishmentProgress[]
  currentUserId: string
  logs: PunishmentLog[]
  exercises: PunishmentExercise[]
  punishment: Punishment
  /** When set (e.g. "Punishment Progress"), used as card title. Otherwise: "Punishment (Name1, Name2)". */
  titleOverride?: string
}

export default function PunishmentLeaderboard({ 
  progressList, 
  currentUserId, 
  logs, 
  exercises, 
  punishment,
  titleOverride,
}: PunishmentLeaderboardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const title = titleOverride ?? (progressList.length > 0 ? `Punishment (${progressList.map(p => p.display_name).join(', ')})` : 'Punishment Leaderboard')
  
  // Calculate shared ranks
  const calculateRanks = (list: PunishmentProgress[]): number[] => {
    if (list.length === 0) return []
    
    const ranks: number[] = []
    let currentRank = 1
    
    for (let i = 0; i < list.length; i++) {
      if (i === 0) {
        ranks.push(1)
      } else {
        const prev = list[i - 1]
        const curr = list[i]
        
        const prevIsPerfect = prev.total_progress >= 1.0 && 
          (!punishment.cardio_target || prev.cardio_progress >= 1.0) && 
          (exercises.length === 0 || prev.strength_overall_progress >= 1.0)
        const currIsPerfect = curr.total_progress >= 1.0 && 
          (!punishment.cardio_target || curr.cardio_progress >= 1.0) && 
          (exercises.length === 0 || curr.strength_overall_progress >= 1.0)
        
        if (prevIsPerfect && currIsPerfect) {
          ranks.push(ranks[i - 1])
        } else if (
          prev.total_progress === curr.total_progress &&
          prev.cardio_progress === curr.cardio_progress &&
          prev.strength_overall_progress === curr.strength_overall_progress
        ) {
          ranks.push(ranks[i - 1])
        } else {
          const previousRank = ranks[i - 1]
          const peopleAtPreviousRank = ranks.filter(r => r === previousRank).length
          currentRank = previousRank + peopleAtPreviousRank
          ranks.push(currentRank)
        }
      }
    }
    
    return ranks
  }
  
  const ranks = calculateRanks(progressList)
  
  // Get top 3
  const top3 = progressList.slice(0, 3)
  const top3Ranks = ranks.slice(0, 3)
  
  // Get current user's position and data
  const currentUserIndex = progressList.findIndex(p => p.user_id === currentUserId)
  const currentUser = progressList[currentUserIndex]
  const currentUserRank = currentUserIndex >= 0 ? ranks[currentUserIndex] : null
  const showCurrentUser = currentUserIndex >= 3
  
  // Determine what to show
  const displayList = isExpanded ? progressList : top3
  const displayRanks = isExpanded ? ranks : top3Ranks
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
    if (cardioTotal > 0 && punishment.cardio_target && punishment.cardio_metric) {
      const metric = punishment.cardio_metric === 'miles' ? 'mi' : 'min'
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
    <div 
      className="rounded-2xl soft-shadow-lg p-3 sm:p-5 mb-4 border border-red-200/50" 
      style={{ 
        background: `
          url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E"),
          linear-gradient(rgba(139, 69, 19, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(139, 69, 19, 0.02) 1px, transparent 1px),
          linear-gradient(to right, rgba(254, 226, 226, 0.95), rgba(254, 202, 202, 0.95))
        `,
        backgroundSize: '400px 400px, 12px 12px, 12px 12px, 100% 100%',
        boxShadow: '0 2px 6px rgba(139, 69, 19, 0.12), 0 8px 24px rgba(139, 69, 19, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
      }}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 tracking-tight">{title}</h2>
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
            className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl transition-all bg-white ${
              progress.user_id === currentUserId 
                ? 'border border-gray-200' 
                : 'hover:bg-gray-50/50'
            }`}
          >
            <div className="flex-shrink-0 w-6 sm:w-8 text-center font-semibold text-gray-700 text-xs sm:text-sm">
              {displayRanks[index]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                {progress.display_name}
                {progress.user_id === currentUserId && ' (You)'}
              </div>
              <div className="w-full bg-gray-200/50 rounded-full h-2 sm:h-2.5 mt-1 sm:mt-1.5 overflow-hidden">
                <div
                  className="bg-red-500/75 h-2 sm:h-2.5 rounded-full transition-all"
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
    
        {!isExpanded && showCurrentUser && currentUser && currentUserRank !== null && (
          <>
            <div className="border-t border-gray-200 my-2"></div>
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-white border border-gray-200">
              <div className="flex-shrink-0 w-6 sm:w-8 text-center font-semibold text-gray-700 text-xs sm:text-sm">
                {currentUserRank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {currentUser.display_name} (You)
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 mt-1 sm:mt-1.5">
                  <div
                    className="bg-red-500/75 h-2 sm:h-2.5 rounded-full transition-all"
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
