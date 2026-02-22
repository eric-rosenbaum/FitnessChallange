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
      <div className="glass-card rounded-2xl soft-shadow-lg p-8 text-center border border-red-100/30">
        <p className="text-gray-700 mb-4 font-medium">No challenge for this week yet</p>
        {isAdmin ? (
          <Link
            href="/settings"
            className="inline-block px-6 py-3 gradient-green-translucent text-white rounded-xl hover:opacity-90 transition-all soft-shadow font-medium"
          >
            Assign a weekly host
          </Link>
        ) : (
          <p className="text-sm text-gray-600 font-medium">Waiting for admin to assign a weekly host</p>
        )}
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl soft-shadow-lg p-8 text-center border border-red-100/30">
      <p className="text-gray-700 mb-4 font-medium">Waiting for host to create this week&apos;s challenge</p>
      {isHost ? (
        <Link
          href="/create-challenge"
          className="inline-block px-6 py-3 gradient-green-translucent text-white rounded-xl hover:opacity-90 transition-all soft-shadow font-medium"
        >
          Create this week&apos;s challenge
        </Link>
      ) : (
        <p className="text-sm text-gray-600 font-medium">The weekly host will create the challenge soon</p>
      )}
    </div>
  )
}
