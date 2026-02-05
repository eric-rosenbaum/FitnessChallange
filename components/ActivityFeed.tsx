'use client'

import { useState, useEffect } from 'react'
import type { ActivityFeedItem, WeekChallenge } from '@/types'
import { getActivityFeed } from '@/lib/db/queries'

interface ActivityFeedProps {
  feedItems: ActivityFeedItem[]
  challenge?: WeekChallenge
  groupId: string
}

export default function ActivityFeed({ feedItems, challenge, groupId }: ActivityFeedProps) {
  const [showModal, setShowModal] = useState(false)
  const [allFeedItems, setAllFeedItems] = useState<ActivityFeedItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return diffMins > 0 ? `${diffMins} min${diffMins > 1 ? 's' : ''} ago` : 'Just now'
    }
  }

  const formatActivity = (item: ActivityFeedItem) => {
    if (item.log_type === 'cardio') {
      const activity = item.cardio_activity || 'activity'
      const amount = item.cardio_amount || 0
      const metric = challenge?.cardio_metric === 'minutes'
        ? (amount === 1 ? 'minute' : 'minutes')
        : (amount === 1 ? 'mile' : 'miles')
      return `logged ${amount} ${metric} ${activity}`
    } else {
      const exercise = item.exercise_name || 'exercise'
      const reps = item.strength_reps || 0
      return `logged ${reps} ${exercise} reps`
    }
  }

  const handleSeeAll = async () => {
    setShowModal(true)
    setIsLoading(true)
    try {
      // Fetch all activity feed items (no limit)
      const allItems = await getActivityFeed(groupId, 1000) // Large limit to get all
      setAllFeedItems(allItems)
    } catch (error) {
      console.error('Error fetching all activity feed:', error)
      setAllFeedItems(feedItems) // Fallback to current items
    } finally {
      setIsLoading(false)
    }
  }

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false)
      }
    }
    if (showModal) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showModal])

  const displayItems = showModal ? allFeedItems : feedItems
  const hasMore = feedItems.length > 0

  return (
    <>
      <div className="glass-card rounded-2xl soft-shadow-lg p-3 sm:p-5 mb-4 border border-red-100/30">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 tracking-tight">Activity Feed</h2>
          {hasMore && (
            <button
              onClick={handleSeeAll}
              className="text-xs sm:text-sm font-medium text-[#8B4513] hover:text-[#6B4423] transition-colors"
            >
              See all
            </button>
          )}
        </div>
        {feedItems.length === 0 ? (
          <p className="text-sm text-gray-500">No activity yet.</p>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {feedItems.map(item => (
              <div key={item.id} className="text-sm p-2 sm:p-3 rounded-xl hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-800 text-xs sm:text-sm">{item.display_name}</span>
                  <span className="text-gray-600 font-medium text-xs sm:text-sm">{formatActivity(item)}</span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 font-medium">{formatTime(item.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false)
            }
          }}
        >
          <div className="glass-card rounded-2xl soft-shadow-lg border border-red-100/30 w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 tracking-tight">Activity Feed</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50/50 rounded-xl transition-colors"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">Loading...</p>
                </div>
              ) : allFeedItems.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {allFeedItems.map(item => (
                    <div key={item.id} className="text-sm p-3 rounded-xl hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-gray-800">{item.display_name}</span>
                        <span className="text-gray-600 font-medium">{formatActivity(item)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-medium">{formatTime(item.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
