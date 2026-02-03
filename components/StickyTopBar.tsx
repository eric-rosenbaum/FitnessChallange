'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface StickyTopBarProps {
  isAdmin?: boolean
  hostName?: string
  challengeCreatedBy?: string
}

export default function StickyTopBar({ isAdmin, hostName, challengeCreatedBy }: StickyTopBarProps) {
  const router = useRouter()
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupabase(createClient())
    }
  }, [])
  
  const handleLogout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/login')
  }
  
  return (
    <div className="sticky top-0 z-50 glass-card border-b border-white/30 soft-shadow">
      <div className="px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Profile Icon */}
          <Link
            href="/profile"
            className="flex-shrink-0 p-1.5 sm:p-2 text-[#8B4513] hover:text-[#6B4423] hover:bg-green-50/50 rounded-xl transition-all"
            aria-label="Profile"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </Link>
          
          {/* Center: Title and Subtitle */}
          <div className="flex flex-col items-center flex-1 min-w-0 px-2">
            <h1 className="text-base sm:text-xl font-bold text-gray-800 tracking-tight truncate w-full text-center">
              FriendsFitnessChallenge
            </h1>
            {challengeCreatedBy && (
              <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 text-center truncate w-full">
                Challenge created by: <span className="font-semibold">{challengeCreatedBy}</span>
              </p>
            )}
          </div>
          
          {/* Right: Settings and Sign Out */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Link
              href="/settings"
              className="p-1.5 sm:p-2 text-[#8B4513] hover:text-[#6B4423] hover:bg-green-50/50 rounded-xl transition-all"
              aria-label="Group settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </Link>
            {supabase && (
              <button
                onClick={handleLogout}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-700 hover:bg-white/50 rounded-xl transition-colors text-[10px] sm:text-sm font-medium whitespace-nowrap"
                aria-label="Sign out"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
