'use client'

import Link from 'next/link'
import type { WeekAssignment } from '@/types'

interface EmptyStateProps {
  weekAssignment?: WeekAssignment
  isHost: boolean
  isAdmin: boolean
}

export default function EmptyState({ weekAssignment, isHost, isAdmin }: EmptyStateProps) {
  if (!weekAssignment) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-600 mb-4">No challenge for this week yet</p>
        {isAdmin ? (
          <Link
            href="/settings"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Assign a weekly host
          </Link>
        ) : (
          <p className="text-sm text-gray-500">Waiting for admin to assign a weekly host</p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <p className="text-gray-600 mb-4">Waiting for host to create this week&apos;s challenge</p>
      {isHost ? (
        <Link
          href="/create-challenge"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create this week&apos;s challenge
        </Link>
      ) : (
        <p className="text-sm text-gray-500">The weekly host will create the challenge soon</p>
      )}
    </div>
  )
}
