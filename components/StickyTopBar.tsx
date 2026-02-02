'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface StickyTopBarProps {
  isAdmin?: boolean
}

export default function StickyTopBar({ isAdmin }: StickyTopBarProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  
  return (
    <div className="sticky top-0 z-50 glass-card border-b border-white/30 soft-shadow">
      <div className="px-4 py-3">
        <div className="flex items-center justify-center relative">
          <Link
            href="/profile"
            className="absolute left-0 p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50 rounded-xl transition-all"
            aria-label="Profile"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
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
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Fitness Challenge</h1>
          <div className="absolute right-0 flex items-center gap-2">
            <Link
              href="/settings"
              className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50 rounded-xl transition-all"
              aria-label="Group settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-700 hover:bg-white/50 rounded-xl transition-colors text-sm font-medium"
              aria-label="Sign out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
