'use client'

import Link from 'next/link'
import type { WeekAssignment } from '@/types'

interface UpcomingHostBannerProps {
  weekAssignment: WeekAssignment
}

export default function UpcomingHostBanner({ weekAssignment }: UpcomingHostBannerProps) {
  // Format date for display
  const formatDateForDisplay = (dateString: string): string => {
    const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (dateMatch) {
      const [, year, month, day] = dateMatch
      const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      return localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  const weekLabel = `Week of ${formatDateForDisplay(weekAssignment.start_date)}`
  
  return (
    <Link href={`/create-challenge?assignmentId=${weekAssignment.id}`}>
      <div className="glass-card rounded-2xl soft-shadow-lg p-4 sm:p-5 mb-4 border-2 border-[#8B4513]/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50 cursor-pointer hover:border-[#8B4513]/70 transition-all transform hover:scale-[1.01]">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
              You&apos;re the host for {weekLabel}!
            </h3>
            <p className="text-sm text-gray-600 font-medium">
              Set your exercises ahead of time
            </p>
          </div>
          <div className="ml-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 sm:h-6 sm:w-6 text-[#8B4513]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  )
}
