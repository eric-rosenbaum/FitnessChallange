'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createGroup } from '@/lib/db/queries'

export default function CreateGroupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setInviteCode(code)
  }
  
  useEffect(() => {
    if (!inviteCode) {
      generateInviteCode()
    }
  }, [])
  
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('You must be logged in to create a group')
      setIsLoading(false)
      return
    }
    
    if (!inviteCode.trim()) {
      setError('Please generate an invite code')
      setIsLoading(false)
      return
    }
    
    try {
      await createGroup(groupName.trim(), inviteCode.toUpperCase().trim(), user.id)
      router.push('/')
    } catch (err: any) {
      // Handle duplicate invite code - regenerate and show message
      if (err.message?.includes('invite code is already taken')) {
        generateInviteCode()
        setError('That invite code was taken. A new one has been generated. Please try again.')
      } else {
        setError(err.message || 'Failed to create group')
      }
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl soft-shadow-lg p-8 w-full max-w-md border border-red-100/30">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight text-center">
          Create Group
        </h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Start a new fitness challenge group
        </p>
        
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
              placeholder="My Fitness Group"
              required
              maxLength={100}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invite Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50 text-center font-semibold tracking-wider"
                placeholder="ABC123"
                required
                maxLength={20}
              />
              <button
                type="button"
                onClick={generateInviteCode}
                className="px-4 py-2 border-2 border-[#8B4513] text-[#8B4513] rounded-xl hover:bg-red-50 font-medium transition-colors"
              >
                Generate
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Share this code with friends to invite them
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading || !groupName.trim() || !inviteCode.trim()}
            className="w-full px-4 py-3 bg-[#8B4513] text-white rounded-xl hover:opacity-90 disabled:opacity-50 soft-shadow font-medium transition-all"
          >
            {isLoading ? 'Creating...' : 'Create Group'}
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
