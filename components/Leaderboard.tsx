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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Leaderboard</h2>
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {displayList.map((progress, index) => (
          <div
            key={progress.user_id}
            className={`flex items-center gap-3 p-2 rounded ${
              progress.user_id === currentUserId ? 'bg-blue-50' : ''
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
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
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
            <div className="flex items-center gap-3 p-2 rounded bg-blue-50">
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
