'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const supabase = createClient()
  
  // Check for error in URL (e.g., expired link)
  useEffect(() => {
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (error === 'access_denied' || error === 'otp_expired') {
      setMessage('The magic link has expired. Please request a new one below.')
    } else if (error) {
      setMessage(errorDescription?.replace(/\+/g, ' ') || 'An error occurred. Please try again.')
    }
  }, [searchParams])
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')
    
    console.log('[LOGIN] Requesting OTP for:', email)
    console.log('[LOGIN] Current cookies:', document.cookie)
    
    const { error, data } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    console.log('[LOGIN] OTP response - error:', error?.message, 'data:', data)
    console.log('[LOGIN] Cookies after OTP request:', document.cookie)
    
    // Check for PKCE cookies
    const pkceCookies = document.cookie.split('; ').filter(c => 
      c.includes('code') || c.includes('verifier') || c.includes('pkce')
    )
    console.log('[LOGIN] PKCE-related cookies:', pkceCookies)
    
    if (error) {
      setMessage(error.message)
      setIsLoading(false)
    } else {
      setMessage('Check your email for the login link! The link will expire in 1 hour.')
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl soft-shadow-lg p-8 w-full max-w-md border border-white/50">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 tracking-tight text-center">
          Fitness Challenge
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50"
              placeholder="your@email.com"
              required
            />
          </div>
          
          {message && (
            <div className={`text-sm p-3 rounded-xl ${
              message.includes('Check your email') 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 gradient-green-translucent text-white rounded-xl hover:opacity-90 disabled:opacity-50 soft-shadow font-medium transition-all"
          >
            {isLoading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          We&apos;ll send you a magic link to sign in. No password needed!
          <br />
          <span className="text-gray-400">Links expire after 1 hour.</span>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}
