import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  // Handle errors (e.g., expired link)
  if (error) {
    const errorMsg = errorDescription?.replace(/\+/g, ' ') || 'Authentication failed'
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorMsg)}`
    )
  }

  if (code) {
    const cookieStore = await cookies()
    
    // Log cookies for debugging
    const allCookies = cookieStore.getAll()
    console.log('[AUTH CALLBACK] Cookies received:', allCookies.map(c => c.name).join(', '))
    console.log('[AUTH CALLBACK] Looking for PKCE cookies:', allCookies.filter(c => 
      c.name.includes('code') || c.name.includes('verifier') || c.name.includes('pkce')
    ).map(c => `${c.name}=${c.value.substring(0, 20)}...`))
    
    // Create Supabase client with proper cookie handling for PKCE
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookies = cookieStore.getAll()
            console.log('[AUTH CALLBACK] getAll() called, returning', cookies.length, 'cookies')
            return cookies
          },
          setAll(cookiesToSet) {
            console.log('[AUTH CALLBACK] setAll() called with', cookiesToSet.length, 'cookies')
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                console.log('[AUTH CALLBACK] Setting cookie:', name, '=', value.substring(0, 20) + '...')
                cookieStore.set(name, value, options)
              })
            } catch (err) {
              console.error('[AUTH CALLBACK] Error setting cookies:', err)
            }
          },
        },
      }
    )

    console.log('[AUTH CALLBACK] Attempting to exchange code for session...')
    const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('[AUTH CALLBACK] Exchange error:', exchangeError.message)
      // If exchange fails, redirect to login with error
      return NextResponse.redirect(
        `${origin}/login?error=access_denied&error_description=${encodeURIComponent(exchangeError.message)}`
      )
    }
    
    console.log('[AUTH CALLBACK] Success! User:', data.user?.email)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/`)
}
