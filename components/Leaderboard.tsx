'use client'

import { useState } from 'react'
import type { UserProgress } from '@/types'

interface LeaderboardProps {
  progressList: UserProgress[]
  currentUserId: string
}

export default function Leaderboard({ progressList, currentUserId }: LeaderboardProps) {
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

  return (
    <div className="glass-card rounded-2xl soft-shadow-lg p-5 mb-4 border border-white/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 tracking-tight">Leaderboard</h2>
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {displayList.map((progress, index) => (
          <div
            key={progress.user_id}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
              progress.user_id === currentUserId 
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50' 
                : 'hover:bg-gray-50/50'
            }`}
          >
            <div className="flex-shrink-0 w-8 text-center font-semibold text-gray-700">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {progress.display_name}
                {progress.user_id === currentUserId && ' (You)'}
              </div>
              <div className="w-full bg-gray-200/50 rounded-full h-2.5 mt-1.5 overflow-hidden">
                <div
                  className="gradient-green-translucent h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(progress.total_progress * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex-shrink-0 text-sm font-medium text-gray-700">
              {Math.round(progress.total_progress * 100)}%
            </div>
          </div>
        ))}
        
        {!isExpanded && showCurrentUser && currentUser && (
          <>
            <div className="border-t border-gray-200 my-2"></div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50">
              <div className="flex-shrink-0 w-8 text-center font-semibold text-gray-700">
                {currentUserIndex + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {currentUser.display_name} (You)
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(currentUser.total_progress * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex-shrink-0 text-sm font-medium text-gray-700">
                {Math.round(currentUser.total_progress * 100)}%
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
