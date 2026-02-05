'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/components/LoadingSpinner'

function ResetPasswordPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  
  const supabase = createClient()
  const code = searchParams.get('code')
  const isPasswordReset = !!code

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Password reset email sent! Check your inbox and click the link to reset your password.')
      }
    } catch (err: any) {
      setMessage(err.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }
    
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }
    
    setIsResetting(true)
    setMessage('')
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })
      
      if (error) {
        setMessage(error.message)
        setIsResetting(false)
      } else {
        setMessage('Password updated successfully! Redirecting...')
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } catch (err: any) {
      setMessage(err.message || 'An unexpected error occurred')
      setIsResetting(false)
    }
  }

  if (isPasswordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl soft-shadow-lg p-8 w-full max-w-md border border-red-100/30">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 tracking-tight text-center">
            Reset Password
          </h1>
          
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>
            
            {message && (
              <div className={`text-sm p-3 rounded-xl ${
                message.includes('successfully')
                  ? 'bg-red-50 text-[#6B4423] border border-red-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isResetting}
              className="w-full px-4 py-3 bg-[#8B4513] text-white rounded-xl hover:opacity-90 disabled:opacity-50 soft-shadow font-medium transition-all"
            >
              {isResetting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl soft-shadow-lg p-8 w-full max-w-md border border-red-100/30">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 tracking-tight text-center">
          Reset Password
        </h1>
        
        <form onSubmit={handleRequestReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
              placeholder="your@email.com"
              required
            />
          </div>
          
          {message && (
            <div className={`text-sm p-3 rounded-xl ${
              message.includes('sent')
                ? 'bg-red-50 text-[#6B4423] border border-red-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-[#8B4513] text-white rounded-xl hover:opacity-90 disabled:opacity-50 soft-shadow font-medium transition-all"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-sm text-[#8B4513] hover:text-[#6B4423] hover:underline"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordPageContent />
    </Suspense>
  )
}
