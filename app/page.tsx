'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import StickyTopBar from '@/components/StickyTopBar'
import ProgressCard from '@/components/ProgressCard'
import Leaderboard from '@/components/Leaderboard'
import ActivityFeed from '@/components/ActivityFeed'
import EmptyState from '@/components/EmptyState'
import {
  dummyCurrentUserId,
  getActiveWeek,
  calculateUserProgress,
  getAllUserProgress,
  getActivityFeed,
  dummyMemberships,
} from '@/lib/dummyData'
import { useApp } from '@/context/AppContext'

export default function HomePage() {
  const { logs } = useApp()
  
  const activeWeek = getActiveWeek()
  const isHost = activeWeek.week_assignment.host_user_id === dummyCurrentUserId
  const currentUserMembership = dummyMemberships.find(m => m.user_id === dummyCurrentUserId)
  const isAdmin = currentUserMembership?.role === 'admin'
  
  // Calculate progress
  const currentUserProgress = useMemo(() => {
    if (!activeWeek.challenge) return null
    return calculateUserProgress(
      dummyCurrentUserId,
      logs,
      activeWeek.challenge,
      activeWeek.exercises
    )
  }, [logs, activeWeek.challenge, activeWeek.exercises])
  
  const allUserIds = dummyMemberships.map(m => m.user_id)
  const allProgress = useMemo(() => {
    if (!activeWeek.challenge) return []
    return getAllUserProgress(
      allUserIds,
      logs,
      activeWeek.challenge,
      activeWeek.exercises
    )
  }, [logs, activeWeek.challenge, activeWeek.exercises, allUserIds])
  
  const activityFeed = useMemo(() => getActivityFeed(logs, 5), [logs])
  
  
  // Empty states
  if (!activeWeek.challenge) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StickyTopBar isAdmin={isAdmin} />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <EmptyState
            weekAssignment={activeWeek.week_assignment}
            isHost={isHost}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <StickyTopBar isAdmin={isAdmin} />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Mobile: Vertical stack */}
        <div className="lg:hidden space-y-4">
          {currentUserProgress && (
            <>
              <ProgressCard
                progress={currentUserProgress}
                challenge={activeWeek.challenge}
                exercises={activeWeek.exercises}
                weekStartDate={activeWeek.week_assignment.start_date}
                weekEndDate={activeWeek.week_assignment.end_date}
                logs={logs}
                userId={dummyCurrentUserId}
              />
              <Link
                href="/log"
                className="block w-full px-4 py-3 bg-blue-600 text-white text-center font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Log
              </Link>
            </>
          )}
          <Leaderboard
            progressList={allProgress}
            currentUserId={dummyCurrentUserId}
          />
          <ActivityFeed feedItems={activityFeed} challenge={activeWeek.challenge} />
        </div>
        
        {/* Desktop: Two-column layout */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
          <div className="space-y-4">
            {currentUserProgress && (
              <>
                <ProgressCard
                  progress={currentUserProgress}
                  challenge={activeWeek.challenge}
                  exercises={activeWeek.exercises}
                  weekStartDate={activeWeek.week_assignment.start_date}
                  weekEndDate={activeWeek.week_assignment.end_date}
                  logs={logs}
                  userId={dummyCurrentUserId}
                />
                <Link
                  href="/log"
                  className="block w-full px-4 py-3 bg-blue-600 text-white text-center font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Log
                </Link>
              </>
            )}
            <ActivityFeed feedItems={activityFeed} challenge={activeWeek.challenge} />
          </div>
          <div className="space-y-4">
            <Leaderboard
              progressList={allProgress}
              currentUserId={dummyCurrentUserId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
