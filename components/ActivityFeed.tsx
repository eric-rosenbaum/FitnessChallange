'use client'

import type { ActivityFeedItem, WeekChallenge } from '@/types'

interface ActivityFeedProps {
  feedItems: ActivityFeedItem[]
  challenge?: WeekChallenge
}

export default function ActivityFeed({ feedItems, challenge }: ActivityFeedProps) {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Activity Feed</h2>
      {feedItems.length === 0 ? (
        <p className="text-sm text-gray-500">No activity yet.</p>
      ) : (
        <div className="space-y-3">
          {feedItems.map(item => (
            <div key={item.id} className="text-sm">
              <div className="flex items-start gap-2">
                <span className="font-medium text-gray-900">{item.display_name}</span>
                <span className="text-gray-600">{formatActivity(item)}</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{formatTime(item.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
