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

      // Get user's group membership
      const { data: membershipData } = await supabase
        .from('group_memberships')
        .select('*, groups(*)')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (membershipData) {
        setMembership(membershipData as GroupMembership)
        setGroup(membershipData.groups as Group)
      }
      setIsLoading(false)
    }

    fetchUserGroup()
  }, [])

  return { group, membership, isLoading }
}
