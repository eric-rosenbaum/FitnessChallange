'use client'

import type { WeekAssignment } from '@/types'

interface WaitingForHostCardProps {
  weekAssignment: WeekAssignment
  hostName: string
}

export default function WaitingForHostCard({ weekAssignment, hostName }: WaitingForHostCardProps) {
  const weekLabel = `Week of ${new Date(weekAssignment.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  
  return (
    <div className="glass-card rounded-2xl soft-shadow-lg p-5 mb-4 border border-gray-300/50 bg-gradient-to-r from-gray-50/50 to-gray-100/50">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Waiting for {hostName} to create challenge
          </h3>
          <p className="text-sm text-gray-600 font-medium">
            {weekLabel}
          </p>
        </div>
      </div>
    </div>
  )
}
