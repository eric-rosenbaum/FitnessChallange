'use client'

import { useMemo, useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import StickyTopBar from '@/components/StickyTopBar'
import ProgressCard from '@/components/ProgressCard'
import GroupProgressCard from '@/components/GroupProgressCard'
import Leaderboard from '@/components/Leaderboard'
import ActivityFeed from '@/components/ActivityFeed'
import EmptyState from '@/components/EmptyState'
import HostPromptCard from '@/components/HostPromptCard'
import WaitingForHostCard from '@/components/WaitingForHostCard'
import { useApp } from '@/context/AppContext'
import { useUserGroup } from '@/lib/hooks/useUserGroup'
import {
  getActiveWeek,
  getUserProgress,
  getLeaderboard,
  getActivityFeed,
  getWorkoutLogs,
  getProfile,
  getGroupMemberships,
} from '@/lib/db/queries'
import type { ActiveWeek, UserProgress, ActivityFeedItem } from '@/types'
import { calculateUserProgress } from '@/lib/dummyData'

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading, challenge, exercises, logs, refreshLogs, setChallenge, setExercises } = useApp()
  const { group, membership, isLoading: groupLoading } = useUserGroup()
  const [activeWeek, setActiveWeek] = useState<ActiveWeek | null>(null)
  const [currentUserProgress, setCurrentUserProgress] = useState<UserProgress | null>(null)
  const [allProgress, setAllProgress] = useState<UserProgress[]>([])
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [numberOfMembers, setNumberOfMembers] = useState(1)

  // Redirect if no user
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Check if user needs onboarding
  useEffect(() => {
    if (user && !authLoading) {
      // Check if profile has display name (not null, empty, or default "User")
      const checkProfile = async () => {
        try {
          const profile = await getProfile(user.id)
          const displayName = profile?.display_name
          // Redirect to onboarding if display_name is missing, empty, or still the default
          if (!displayName || !displayName.trim() || displayName === 'User') {
            router.push('/onboarding')
          }
        } catch (error) {
          // Profile might not exist yet, redirect to onboarding
          router.push('/onboarding')
        }
      }
      checkProfile()
    }
  }, [user, authLoading, router])

  // Fetch number of members (always fetch this when group is available)
  useEffect(() => {
    if (group?.id) {
      getGroupMemberships(group.id).then((memberships) => {
        console.log('[HomePage] Fetched memberships:', memberships.length, 'members')
        setNumberOfMembers(memberships.length)
      }).catch((error) => {
        console.error('[HomePage] Error fetching memberships:', error)
      })
    }
  }, [group?.id])

  // Fetch active week and data
  useEffect(() => {
    if (!group || !user || authLoading || groupLoading) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function fetchData() {
      try {
        setIsLoading(true)
        // Get active week
        if (!group) return
        const weekData = await getActiveWeek(group.id)
        
        if (cancelled) return
        
        setActiveWeek(weekData)
        
        console.log('[HomePage] Active week data:', {
          hasWeekAssignment: !!weekData?.week_assignment,
          hasChallenge: !!weekData?.challenge,
          hostUserId: weekData?.week_assignment?.host_user_id,
          currentUserId: user?.id,
          isHost: weekData?.week_assignment?.host_user_id === user?.id
        })

        if (weekData?.challenge) {
          setChallenge(weekData.challenge)
          setExercises(weekData.exercises)

          // Fetch logs (all group logs, not just current user)
          await refreshLogs(weekData.challenge.id)
          
          // Get all logs for debugging
          const allLogs = await getWorkoutLogs(weekData.challenge.id)
          console.log('[HomePage] All logs fetched:', {
            totalLogs: allLogs.length,
            cardioLogs: allLogs.filter(log => log.log_type === 'cardio').length,
            strengthLogs: allLogs.filter(log => log.log_type === 'strength').length,
            uniqueUsers: Array.from(new Set(allLogs.map(log => log.user_id))),
            userCount: new Set(allLogs.map(log => log.user_id)).size,
          })

          // Get user progress
          const userProgress = await getUserProgress(user.id, weekData.challenge.id)
          setCurrentUserProgress(userProgress)

          // Get leaderboard
          const leaderboard = await getLeaderboard(group.id)
          setAllProgress(leaderboard)

          // Get activity feed
          const feed = await getActivityFeed(group.id, 5)
          setActivityFeed(feed)
        } else {
          setChallenge(null)
          setExercises([])
          // Still show leaderboard and activity feed even without challenge
          if (weekData?.week_assignment) {
            const leaderboard = await getLeaderboard(group.id)
            setAllProgress(leaderboard)
            const feed = await getActivityFeed(group.id, 5)
            setActivityFeed(feed)
          }
        }
      } catch (error) {
        if (cancelled) return
        console.error('Error fetching data:', error)
        // Set activeWeek to null on error to prevent infinite loops
        setActiveWeek(null)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchData()
    
    return () => {
      cancelled = true
    }
  }, [group?.id, user?.id, authLoading, groupLoading]) // Only depend on IDs, not objects

  // Refresh when returning from settings (check for refresh param)
  useEffect(() => {
    const refresh = searchParams.get('refresh')
    if (refresh === 'true' && group) {
      // Remove the refresh param from URL
      window.history.replaceState({}, '', window.location.pathname)
      // Force a re-fetch
      getActiveWeek(group.id)
        .then(setActiveWeek)
        .catch(err => {
          console.error('Error refreshing active week:', err)
          setActiveWeek(null)
        })
    }
  }, [searchParams, group?.id])

  // Refresh logs when challenge changes
  useEffect(() => {
    if (challenge && user) {
      refreshLogs(challenge.id).then(() => {
        // Re-fetch progress after logs update
        if (challenge) {
          getUserProgress(user.id, challenge.id).then(setCurrentUserProgress)
          if (group) {
            getLeaderboard(group.id).then(setAllProgress)
            getActivityFeed(group.id, 5).then(setActivityFeed)
          }
        }
      })
    }
  }, [challenge, user, group, refreshLogs])

  if (authLoading || groupLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // No group - show create/join options
  if (!group) {
    return (
      <div className="min-h-screen">
        <StickyTopBar isAdmin={false} />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="glass-card rounded-2xl soft-shadow-lg p-8 text-center border border-red-100/30">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome!</h2>
            <p className="text-gray-600 mb-6">Get started by creating or joining a group</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/create-group"
                className="px-6 py-3 bg-[#8B4513] text-white rounded-xl hover:opacity-90 transition-all soft-shadow font-medium"
              >
                Create Group
              </Link>
              <Link
                href="/join"
                className="px-6 py-3 border-2 border-[#8B4513] text-[#8B4513] rounded-xl hover:bg-green-50 transition-all font-medium"
              >
                Join Group
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isHost = activeWeek?.week_assignment?.host_user_id === user?.id
  const isAdmin = membership?.role === 'admin'
  const showHostPrompt = isHost && activeWeek?.week_assignment && !activeWeek?.challenge
  const showWaitingForHost = !isHost && activeWeek?.week_assignment && !activeWeek?.challenge && activeWeek?.host_name

  // Empty states - only show if there's no week assignment at all
  // If there's a week assignment but no challenge, show the host prompt or waiting message
  if (!activeWeek?.week_assignment) {
    return (
      <div className="min-h-screen">
        <StickyTopBar 
          isAdmin={isAdmin} 
          hostName={activeWeek?.host_name}
          challengeCreatedBy={activeWeek?.challenge ? activeWeek.host_name : undefined}
        />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <EmptyState
            weekAssignment={activeWeek?.week_assignment}
            isHost={isHost}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <StickyTopBar 
        isAdmin={isAdmin} 
        hostName={activeWeek?.host_name}
        challengeCreatedBy={activeWeek?.challenge ? activeWeek.host_name : undefined}
      />
      
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Mobile: Vertical stack */}
        <div className="lg:hidden space-y-3 sm:space-y-4">
          {showHostPrompt && activeWeek?.week_assignment && (
            <HostPromptCard weekAssignment={activeWeek.week_assignment} />
          )}
          {showWaitingForHost && activeWeek?.week_assignment && activeWeek?.host_name && (
            <WaitingForHostCard 
              weekAssignment={activeWeek.week_assignment} 
              hostName={activeWeek.host_name}
            />
          )}
          {activeWeek?.challenge && currentUserProgress && (
            <>
              <ProgressCard
                progress={currentUserProgress}
                challenge={activeWeek.challenge}
                exercises={exercises.length > 0 ? exercises : activeWeek.exercises}
                weekStartDate={activeWeek.week_assignment.start_date}
                weekEndDate={activeWeek.week_assignment.end_date}
                logs={logs.filter(log => log.user_id === user?.id)}
                userId={user?.id ?? ''}
              />
              <Link
                href="/log"
                className="block w-full px-4 py-3 bg-[#8B4513] text-white text-center font-medium rounded-xl soft-shadow hover:opacity-90 transition-all transform hover:scale-[1.02]"
              >
                Log
              </Link>
            </>
          )}
          {activeWeek?.challenge && (
            <GroupProgressCard
              challenge={activeWeek.challenge}
              exercises={exercises.length > 0 ? exercises : activeWeek.exercises}
              weekStartDate={activeWeek.week_assignment.start_date}
              weekEndDate={activeWeek.week_assignment.end_date}
              logs={logs}
              numberOfMembers={numberOfMembers}
            />
          )}
          {allProgress.length > 0 && activeWeek?.challenge && (
            <Leaderboard
              progressList={allProgress}
              currentUserId={user?.id || ''}
              logs={logs}
              exercises={exercises.length > 0 ? exercises : activeWeek.exercises}
              challenge={activeWeek.challenge}
            />
          )}
          {activityFeed.length > 0 && (
            <ActivityFeed feedItems={activityFeed} challenge={activeWeek?.challenge} />
          )}
        </div>
        
        {/* Desktop: Two-column layout */}
        <div className="hidden lg:block space-y-4">
          {/* Full-width banner cards at top */}
          {showHostPrompt && activeWeek?.week_assignment && (
            <HostPromptCard weekAssignment={activeWeek.week_assignment} />
          )}
          {showWaitingForHost && activeWeek?.week_assignment && activeWeek?.host_name && (
            <WaitingForHostCard 
              weekAssignment={activeWeek.week_assignment} 
              hostName={activeWeek.host_name}
            />
          )}
          
          {/* Two-column grid for main content */}
          <div className="grid lg:grid-cols-2 lg:gap-6">
            <div className="space-y-4">
              {activeWeek?.challenge && currentUserProgress && (
              <>
                <ProgressCard
                  progress={currentUserProgress}
                  challenge={activeWeek.challenge}
                  exercises={exercises.length > 0 ? exercises : activeWeek.exercises}
                  weekStartDate={activeWeek.week_assignment.start_date}
                  weekEndDate={activeWeek.week_assignment.end_date}
                  logs={logs.filter(log => log.user_id === user?.id)}
                  userId={user?.id ?? ''}
                />
                <Link
                  href="/log"
                  className="block w-full px-4 py-3 bg-[#8B4513] text-white text-center font-medium rounded-xl soft-shadow hover:opacity-90 transition-all transform hover:scale-[1.02]"
                >
                  Log
                </Link>
              </>
            )}
            <ActivityFeed feedItems={activityFeed} challenge={activeWeek?.challenge} />
          </div>
          <div className="space-y-4">
            {activeWeek?.challenge && (
              <GroupProgressCard
                challenge={activeWeek.challenge}
                exercises={exercises.length > 0 ? exercises : activeWeek.exercises}
                weekStartDate={activeWeek.week_assignment.start_date}
                weekEndDate={activeWeek.week_assignment.end_date}
                logs={logs}
                numberOfMembers={numberOfMembers}
              />
            )}
            {allProgress.length > 0 && activeWeek?.challenge && (
              <Leaderboard
                progressList={allProgress}
                currentUserId={user?.id || ''}
                logs={logs}
                exercises={exercises.length > 0 ? exercises : activeWeek.exercises}
                challenge={activeWeek.challenge}
              />
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
