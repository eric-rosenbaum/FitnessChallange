'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import StickyTopBar from '@/components/StickyTopBar'
import ChallengeSummaryCard from '@/components/ChallengeSummaryCard'
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
  getGroupCompletion,
  dummyMemberships,
} from '@/lib/dummyData'
import { useApp } from '@/context/AppContext'

export default function HomePage() {
  const router = useRouter()
  const { logs, deleteLog } = useApp()
  
  const activeWeek = getActiveWeek()
  const isHost = activeWeek.week_assignment.host_user_id === dummyCurrentUserId
  const currentUserMembership = dummyMemberships.find(m => m.user_id === dummyCurrentUserId)
  const isAdmin = currentUserMembership?.role === 'admin'
  
  // Format week label and date range
  const weekLabel = `Week of ${new Date(activeWeek.week_assignment.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  const dateRange = `${new Date(activeWeek.week_assignment.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(activeWeek.week_assignment.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  
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
  
  const completionCount = useMemo(() => {
    if (allProgress.length === 0) return { finished: 0, total: allUserIds.length }
    return getGroupCompletion(allProgress)
  }, [allProgress, allUserIds.length])
  
  // Get recent logs for current user (last 5)
  const recentLogs = useMemo(() => {
    return logs
      .filter(log => log.user_id === dummyCurrentUserId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [logs])
  
  const handleEditLog = (logId: string) => {
    router.push(`/log?edit=${logId}`)
  }
  
  const handleDeleteLog = (logId: string) => {
    deleteLog(logId)
  }
  
  // Empty states
  if (!activeWeek.challenge) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StickyTopBar
          weekLabel={weekLabel}
          dateRange={dateRange}
          hostName={activeWeek.host_name}
          isAdmin={isAdmin}
        />
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
      <StickyTopBar
        weekLabel={weekLabel}
        dateRange={dateRange}
        hostName={activeWeek.host_name}
        isAdmin={isAdmin}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Mobile: Vertical stack */}
        <div className="lg:hidden space-y-4">
          <ChallengeSummaryCard
            challenge={activeWeek.challenge}
            exercises={activeWeek.exercises}
            completionCount={completionCount}
          />
          {currentUserProgress && (
            <ProgressCard
              progress={currentUserProgress}
              challenge={activeWeek.challenge}
              exercises={activeWeek.exercises}
              recentLogs={recentLogs}
              onEditLog={handleEditLog}
              onDeleteLog={handleDeleteLog}
            />
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
            <ChallengeSummaryCard
              challenge={activeWeek.challenge}
              exercises={activeWeek.exercises}
              completionCount={completionCount}
            />
            {currentUserProgress && (
              <ProgressCard
                progress={currentUserProgress}
                challenge={activeWeek.challenge}
                exercises={activeWeek.exercises}
                recentLogs={recentLogs}
                onEditLog={handleEditLog}
                onDeleteLog={handleDeleteLog}
              />
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
