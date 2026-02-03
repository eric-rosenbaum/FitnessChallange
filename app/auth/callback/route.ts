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

  // Handle errors
  if (error) {
    const errorMsg = errorDescription?.replace(/\+/g, ' ') || 'Authentication failed'
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorMsg)}`
    )
  }

  // Handle email verification or password reset callback
  if (code) {
    const cookieStore = await cookies()
    
    // Create Supabase client
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (err) {
              console.error('[AUTH CALLBACK] Error setting cookies:', err)
            }
          },
        },
      }
    )

    // Exchange code for session (for email verification after sign up)
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('[AUTH CALLBACK] Exchange error:', exchangeError.message)
      return NextResponse.redirect(
        `${origin}/login?error=access_denied&error_description=${encodeURIComponent(exchangeError.message)}`
      )
    }
  }

  // Redirect to home after successful authentication
  return NextResponse.redirect(`${origin}/`)
}
