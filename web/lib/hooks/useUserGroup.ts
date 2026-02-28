import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Group, GroupMembership } from '@/types'

export function useUserGroup() {
  const [group, setGroup] = useState<Group | null>(null)
  const [membership, setMembership] = useState<GroupMembership | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Only create client in browser
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    async function fetchUserGroup() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsLoading(false)
        return
      }

      // Get user's group membership (use limit(1) to avoid "cannot coerce" when group was deleted)
      const { data: membershipRows } = await supabase
        .from('group_memberships')
        .select('*, groups(*)')
        .eq('user_id', user.id)
        .limit(1)

      const membershipData = membershipRows?.[0]
      if (membershipData && (membershipData as any).groups) {
        setMembership(membershipData as GroupMembership)
        setGroup((membershipData as any).groups as Group)
      } else {
        setGroup(null)
        setMembership(null)
      }
      setIsLoading(false)
    }

    fetchUserGroup()
  }, [])

  return { group, membership, isLoading }
}
