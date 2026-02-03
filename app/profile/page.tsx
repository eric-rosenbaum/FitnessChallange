'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import { getProfile, updateProfile } from '@/lib/db/queries'
import { createClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const { user } = useApp()
  const [displayName, setDisplayName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()
  
  useEffect(() => {
    if (user) {
      getProfile(user.id).then((profile) => {
        if (profile) {
          setDisplayName(profile.display_name)
        }
        setIsLoading(false)
      })
    }
  }, [user])
  
  const handleSaveName = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      await updateProfile(user.id, displayName.trim())
      alert('Display name saved!')
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to save'))
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleResetPassword = async () => {
    if (!user?.email) return
    
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Password reset email sent! Check your inbox.')
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 hover:underline text-sm font-medium">← Back to home</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 tracking-tight">Profile</h1>
        </div>
        
        <div className="space-y-6">
          {/* Display Name */}
          <div className="glass-card rounded-2xl soft-shadow-lg p-6 border border-white/50">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 tracking-tight">Display Name</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50"
                  placeholder="Enter your display name"
                />
              </div>
              
              <button
                onClick={handleSaveName}
                disabled={isSaving}
                className="w-full px-4 py-3 gradient-green-translucent text-white rounded-xl hover:opacity-90 transition-all soft-shadow font-medium disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
          
          {/* Password Reset */}
          <div className="glass-card rounded-2xl soft-shadow-lg p-6 border border-white/50">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 tracking-tight">Password</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Reset your password to keep your account secure.
              </p>
              <button
                onClick={handleResetPassword}
                className="w-full px-4 py-3 border-2 border-emerald-500 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all font-medium"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
