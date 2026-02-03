'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { joinGroupByInviteCode } from '@/lib/db/queries'

export default function JoinPage() {
  const router = useRouter()
  const supabase = createClient()
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in to join a group')
      setIsLoading(false)
      return
    }
    
    try {
      await joinGroupByInviteCode(inviteCode.toUpperCase().trim(), user.id)
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to join group')
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl soft-shadow-lg p-8 w-full max-w-md border border-red-100/30">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight text-center">
          Join Group
        </h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Enter the invite code to join a fitness challenge group
        </p>
        
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50 text-center text-lg font-semibold tracking-wider"
              placeholder="ABC123"
              required
              maxLength={20}
            />
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading || !inviteCode.trim()}
            className="w-full px-4 py-3 bg-[#8B4513] text-white rounded-xl hover:opacity-90 disabled:opacity-50 soft-shadow font-medium transition-all"
          >
            {isLoading ? 'Joining...' : 'Join Group'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-[#8B4513] hover:text-[#6B4423] hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
