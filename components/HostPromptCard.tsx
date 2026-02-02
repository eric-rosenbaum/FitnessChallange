'use client'

import Link from 'next/link'
import type { WeekAssignment } from '@/types'

interface HostPromptCardProps {
  weekAssignment: WeekAssignment
}

export default function HostPromptCard({ weekAssignment }: HostPromptCardProps) {
  const weekLabel = `Week of ${new Date(weekAssignment.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  
  return (
    <Link href="/create-challenge">
      <div className="glass-card rounded-2xl soft-shadow-lg p-5 mb-4 border-2 border-emerald-300/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 cursor-pointer hover:border-emerald-400/70 transition-all transform hover:scale-[1.02]">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              You&apos;re the host for {weekLabel}!
            </h3>
            <p className="text-sm text-gray-600 font-medium">
              Set your challenge
            </p>
          </div>
          <div className="ml-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-emerald-600"
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
