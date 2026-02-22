'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [lastSignupAttempt, setLastSignupAttempt] = useState<number>(0)
  
  const supabase = createClient()
  
  // Check for error in URL
  useEffect(() => {
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (error) {
      setMessage(errorDescription?.replace(/\+/g, ' ') || 'An error occurred. Please try again.')
    }
  }, [searchParams])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    
    try {
      if (isSignUp) {
        // Rate limiting: prevent signup attempts more than once every 5 seconds
        // Set to 0 to disable client-side rate limiting (not recommended)
        const now = Date.now()
        const timeSinceLastAttempt = now - lastSignupAttempt
        const minTimeBetweenAttempts = 5000 // 5 seconds (change to 0 to disable, or increase for stricter limiting)
        
        if (minTimeBetweenAttempts > 0 && timeSinceLastAttempt < minTimeBetweenAttempts) {
          const secondsRemaining = Math.ceil((minTimeBetweenAttempts - timeSinceLastAttempt) / 1000)
          setMessage(`Please wait ${secondsRemaining} second${secondsRemaining > 1 ? 's' : ''} before trying again.`)
          setIsLoading(false)
          return
        }
        
        setLastSignupAttempt(now)
        
        // Sign up
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        
        if (error) {
          // Handle rate limit errors specifically
          if (error.message.includes('rate limit') || error.message.includes('too many requests') || error.status === 429) {
            setMessage('Too many signup attempts. Please wait a few minutes and try again.')
          } else {
            setMessage(error.message)
          }
          setIsLoading(false)
        } else {
          // Check if email confirmation is required
          // If user is already signed in, email confirmation is disabled
          if (data.user && data.session) {
            // Email confirmation is disabled - user can sign in immediately
            // Redirect to onboarding to set display name
            setMessage('Account created successfully! Redirecting to set up your profile...')
            setTimeout(() => {
              router.push('/onboarding')
            }, 1000)
          } else if (data.user && !data.session) {
            // Email confirmation is required
            setMessage('Account created! Please check your email (including spam folder) to verify your account. After verification, you\'ll be prompted to set up your profile.')
          } else {
            // Fallback message
            setMessage('Account created! Please check your email to verify your account.')
          }
        }
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) {
          setMessage(error.message)
          setIsLoading(false)
        } else {
          // Success - redirect will happen automatically via middleware
          router.push('/')
          router.refresh()
        }
      }
    } catch (err: any) {
      setMessage(err.message || 'An unexpected error occurred')
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl soft-shadow-lg p-8 w-full max-w-md border border-red-100/30">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 tracking-tight text-center">
          FriendsFitnessChallenge
        </h1>
        
        {/* Toggle between Sign In and Sign Up */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false)
              setMessage('')
            }}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
              !isSignUp
                ? 'bg-[#8B4513] text-white soft-shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true)
              setMessage('')
            }}
            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
              isSignUp
                ? 'bg-[#8B4513] text-white soft-shadow'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sign Up
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>
          
          {message && (
            <div className={`text-sm p-3 rounded-xl ${
              message.includes('Account created') || message.includes('check your email')
                ? 'bg-green-50 text-green-700 border border-green-200' 
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
            {isLoading 
              ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
              : (isSignUp ? 'Sign Up' : 'Sign In')
            }
          </button>
        </form>
        
        {!isSignUp && (
          <div className="mt-4 text-center">
            <Link
              href="/reset-password"
              className="text-sm text-[#8B4513] hover:text-[#6B4423] hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginPageContent />
    </Suspense>
  )
}
