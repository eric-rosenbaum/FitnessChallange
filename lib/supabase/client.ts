'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Only create client in browser (not during SSR)
  if (typeof window === 'undefined') {
    throw new Error('createClient can only be called in the browser')
  }
  
  // Reuse existing client if available
  if (client) return client
  
  // createBrowserClient from @supabase/ssr automatically handles cookies
  // It reads from document.cookie automatically
  // We need to provide cookie handlers to ensure cookies are read correctly
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Parse document.cookie into array of { name, value } objects
          const cookies: { name: string; value: string }[] = []
          if (document.cookie) {
            document.cookie.split('; ').forEach(cookie => {
              const [name, ...rest] = cookie.split('=')
              if (name && rest.length > 0) {
                cookies.push({ name: name.trim(), value: rest.join('=') })
              }
            })
          }
          return cookies
        },
        setAll(cookiesToSet) {
          // Set cookies via document.cookie
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${value}`
            if (options?.maxAge) {
              cookieString += `; max-age=${options.maxAge}`
            }
            if (options?.path) {
              cookieString += `; path=${options.path}`
            }
            if (options?.domain) {
              cookieString += `; domain=${options.domain}`
            }
            if (options?.sameSite) {
              cookieString += `; samesite=${options.sameSite}`
            }
            if (options?.secure) {
              cookieString += `; secure`
            }
            // Note: httpOnly cookies cannot be set from client-side JavaScript
            document.cookie = cookieString
          })
        },
      },
    }
  )
  
  return client
}
