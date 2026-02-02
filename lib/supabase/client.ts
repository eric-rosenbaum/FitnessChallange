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
  
  // createBrowserClient from @supabase/ssr automatically handles cookies for PKCE
  // It stores the code verifier in cookies automatically
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return client
}
