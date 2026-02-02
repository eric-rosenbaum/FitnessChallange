'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from '@/lib/db/queries'
import Link from 'next/link'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        // Check if profile exists
        supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data && (data as { display_name?: string }).display_name) {
              router.push('/')
            }
          })
      } else {
        router.push('/login')
      }
    })
  }, [router, supabase])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setIsLoading(true)
    
    try {
      await updateProfile(user.id, displayName.trim())
      router.push('/')
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to save'))
      setIsLoading(false)
    }
  }
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl soft-shadow-lg p-8 w-full max-w-md border border-white/50">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight text-center">
          Welcome!
        </h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Let&apos;s set up your profile
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50"
              placeholder="Your name"
              required
              maxLength={50}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !displayName.trim()}
            className="w-full px-4 py-3 gradient-green-translucent text-white rounded-xl hover:opacity-90 disabled:opacity-50 soft-shadow font-medium transition-all"
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Sign out
          </Link>
        </div>
      </div>
    </div>
  )
}
