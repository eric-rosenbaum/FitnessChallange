'use client'

import { useMemo, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StickyTopBar from '@/components/StickyTopBar'
import ProgressCard from '@/components/ProgressCard'
import Leaderboard from '@/components/Leaderboard'
import ActivityFeed from '@/components/ActivityFeed'
import EmptyState from '@/components/EmptyState'
import HostPromptCard from '@/components/HostPromptCard'
import { useApp } from '@/context/AppContext'
import { useUserGroup } from '@/lib/hooks/useUserGroup'
import {
  getActiveWeek,
  getUserProgress,
  getLeaderboard,
  getActivityFeed,
  getWorkoutLogs,
  getProfile,
} from '@/lib/db/queries'
import type { ActiveWeek, UserProgress, ActivityFeedItem } from '@/types'
import { calculateUserProgress } from '@/lib/dummyData'

export default function HomePage() {
  const router = useRouter()
  const { user, loading: authLoading, challenge, exercises, logs, refreshLogs, setChallenge, setExercises } = useApp()
  const { group, membership, isLoading: groupLoading } = useUserGroup()
  const [activeWeek, setActiveWeek] = useState<ActiveWeek | null>(null)
  const [currentUserProgress, setCurrentUserProgress] = useState<UserProgress | null>(null)
  const [allProgress, setAllProgress] = useState<UserProgress[]>([])
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if no user
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Check if user needs onboarding
  useEffect(() => {
    if (user && !authLoading) {
      // Check if profile has display name
      const checkProfile = async () => {
        try {
          const profile = await getProfile(user.id)
          if (!profile?.display_name) {
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

  // Fetch active week and data
  useEffect(() => {
    if (!group || !user || authLoading || groupLoading) {
      setIsLoading(false)
      return
    }

    async function fetchData() {
      try {
        // Get active week
        if (!group) return
        const weekData = await getActiveWeek(group.id)
        setActiveWeek(weekData)

        if (weekData?.challenge) {
          setChallenge(weekData.challenge)
          setExercises(weekData.exercises)

          // Fetch logs
          await refreshLogs(weekData.challenge.id)

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
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [group, user, authLoading, groupLoading, refreshLogs, setChallenge, setExercises])

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
          <div className="glass-card rounded-2xl soft-shadow-lg p-8 text-center border border-white/50">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome!</h2>
            <p className="text-gray-600 mb-6">Get started by creating or joining a group</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/create-group"
                className="px-6 py-3 gradient-green-translucent text-white rounded-xl hover:opacity-90 transition-all soft-shadow font-medium"
              >
                Create Group
              </Link>
              <Link
                href="/join"
                className="px-6 py-3 border-2 border-emerald-500 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all font-medium"
              >
                Join Group
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isHost = activeWeek?.week_assignment.host_user_id === user?.id
  const isAdmin = membership?.role === 'admin'
  const showHostPrompt = isHost && !activeWeek?.challenge

  // Empty states
  if (!activeWeek?.challenge && !showHostPrompt) {
    return (
      <div className="min-h-screen">
        <StickyTopBar isAdmin={isAdmin} />
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
      <StickyTopBar isAdmin={isAdmin} />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Mobile: Vertical stack */}
        <div className="lg:hidden space-y-4">
          {showHostPrompt && activeWeek && (
            <HostPromptCard weekAssignment={activeWeek.week_assignment} />
          )}
          {currentUserProgress && activeWeek?.challenge && (
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
                className="block w-full px-4 py-3 gradient-green-translucent text-white text-center font-medium rounded-xl soft-shadow hover:opacity-90 transition-all transform hover:scale-[1.02]"
              >
                Log
              </Link>
            </>
          )}
          <Leaderboard
            progressList={allProgress}
            currentUserId={user?.id || ''}
          />
          <ActivityFeed feedItems={activityFeed} challenge={activeWeek?.challenge} />
        </div>
        
        {/* Desktop: Two-column layout */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
          <div className="space-y-4">
            {showHostPrompt && activeWeek && (
              <HostPromptCard weekAssignment={activeWeek.week_assignment} />
            )}
            {currentUserProgress && activeWeek?.challenge && (
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
                  className="block w-full px-4 py-3 gradient-green-translucent text-white text-center font-medium rounded-xl soft-shadow hover:opacity-90 transition-all transform hover:scale-[1.02]"
                >
                  Log
                </Link>
              </>
            )}
            <ActivityFeed feedItems={activityFeed} challenge={activeWeek?.challenge} />
          </div>
          <div className="space-y-4">
            <Leaderboard
              progressList={allProgress}
              currentUserId={user?.id || ''}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
