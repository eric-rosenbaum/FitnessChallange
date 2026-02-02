'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import { useUserGroup } from '@/lib/hooks/useUserGroup'
import {
  getGroup,
  getGroupMemberships,
  updateGroupName,
  removeMember,
  createWeekAssignment,
  getActiveWeek,
} from '@/lib/db/queries'
import { createClient } from '@/lib/supabase/client'
import type { GroupMembership } from '@/types'

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useApp()
  const { group, membership } = useUserGroup()
  const supabase = createClient()
  
  const [memberships, setMemberships] = useState<GroupMembership[]>([])
  const [groupName, setGroupName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [hostUserId, setHostUserId] = useState('')
  const [assignmentStartDate, setAssignmentStartDate] = useState('')
  const [assignmentEndDate, setAssignmentEndDate] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  
  const currentUserMembership = memberships.find(m => m.user_id === user?.id)
  const isAdmin = currentUserMembership?.role === 'admin'
  
  // Fetch group data
  useEffect(() => {
    if (group) {
      getGroup(group.id).then((groupData) => {
        if (groupData) {
          setGroupName(groupData.name)
        }
      })
      
      getGroupMemberships(group.id).then((membershipsData) => {
        setMemberships(membershipsData)
        setIsLoading(false)
      })
      
      // Fetch active week for host assignment
      getActiveWeek(group.id).then((week) => {
        if (week) {
          setHostUserId(week.week_assignment.host_user_id)
          setAssignmentStartDate(week.week_assignment.start_date)
          setAssignmentEndDate(week.week_assignment.end_date)
        } else {
          // Set default dates (next week)
          const nextWeek = new Date()
          nextWeek.setDate(nextWeek.getDate() + 7)
          const endWeek = new Date(nextWeek)
          endWeek.setDate(endWeek.getDate() + 6)
          setAssignmentStartDate(nextWeek.toISOString().split('T')[0])
          setAssignmentEndDate(endWeek.toISOString().split('T')[0])
        }
      })
    }
  }, [group])
  
  const [membersWithProfiles, setMembersWithProfiles] = useState<any[]>([])
  
  useEffect(() => {
    async function fetchProfiles() {
      const membersWithProfilesData = await Promise.all(
        memberships.map(async (m) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', m.user_id)
            .single()
          return { ...m, profile: { id: m.user_id, display_name: (profile as { display_name?: string } | null)?.display_name || 'Unknown' } }
        })
      )
      setMembersWithProfiles(membersWithProfilesData)
    }
    if (memberships.length > 0) {
      fetchProfiles()
    }
  }, [memberships, supabase])
  
  const handleSaveGroupName = async () => {
    if (!group) return
    
    setIsSaving(true)
    try {
      await updateGroupName(group.id, groupName.trim())
      alert('Group name saved!')
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to save'))
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleRemoveMember = async (userIdToRemove: string) => {
    if (!group) return
    
    if (userIdToRemove === user?.id) {
      // User is leaving the group
      if (!confirm('Are you sure you want to leave this group?')) {
        return
      }
      try {
        await removeMember(group.id, userIdToRemove)
        alert('You have left the group.')
        router.push('/')
      } catch (error: any) {
        alert('Error: ' + (error.message || 'Failed to leave group'))
      }
    } else {
      // Removing another member
      if (!confirm(`Are you sure you want to remove this member?`)) {
        return
      }
      try {
        await removeMember(group.id, userIdToRemove)
        // Refresh memberships
        const updated = await getGroupMemberships(group.id)
        setMemberships(updated)
        alert('Member removed.')
      } catch (error: any) {
        alert('Error: ' + (error.message || 'Failed to remove member'))
      }
    }
  }
  
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!group || !newMemberEmail.trim()) return
    
    setIsAddingMember(true)
    try {
      // For now, we'll use invite codes - email invites would require additional setup
      alert('To add members, share your group invite code: ' + group.invite_code)
      setNewMemberEmail('')
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to add member'))
    } finally {
      setIsAddingMember(false)
    }
  }
  
  const handleAssignHost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!group || !user || !isAdmin) return
    
    if (!hostUserId || !assignmentStartDate || !assignmentEndDate) {
      alert('Please fill in all fields')
      return
    }
    
    setIsAssigning(true)
    try {
      await createWeekAssignment(
        group.id,
        assignmentStartDate,
        assignmentEndDate,
        hostUserId,
        user.id
      )
      alert('Weekly host assigned!')
      router.push('/')
    } catch (error: any) {
      alert('Error: ' + (error.message || 'Failed to assign host'))
      setIsAssigning(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }
  
  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl soft-shadow-lg p-6 text-center max-w-md border border-white/50">
          <p className="text-gray-700 mb-4 font-medium">No group found</p>
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium">Back to home</Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700 hover:underline text-sm font-medium">← Back to home</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 tracking-tight">Group Settings</h1>
        </div>
        
        <div className="space-y-6">
          {/* Group Name */}
          <div className="glass-card rounded-2xl soft-shadow-lg p-6 border border-white/50">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 tracking-tight">Group Name</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50"
                placeholder="Group name"
              />
              <button
                onClick={handleSaveGroupName}
                disabled={isSaving}
                className="px-4 py-2 gradient-green-translucent text-white rounded-xl hover:opacity-90 disabled:opacity-50 soft-shadow font-medium transition-all"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          
          {/* Members */}
          <div className="glass-card rounded-2xl soft-shadow-lg p-6 border border-white/50">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 tracking-tight">Members</h2>
            <div className="space-y-2 mb-4">
              {membersWithProfiles.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-white/50 transition-colors border-b border-gray-100/50 last:border-0">
                  <div>
                    <span className="text-base font-semibold text-gray-800">{member.profile?.display_name || 'Unknown'}</span>
                    {member.user_id === user?.id && (
                      <span className="text-xs text-gray-600 ml-2 font-medium">(You)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-medium border border-emerald-100/50">
                      {member.role}
                    </span>
                    {memberships.length > 1 && (
                      member.user_id === user?.id ? (
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Leave
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add Member */}
            <div className="pt-4 border-t border-gray-200/50">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 tracking-tight">Add Member</h3>
              <p className="text-sm text-gray-600 mb-3">
                Share this invite code: <span className="font-mono font-bold text-emerald-600">{group.invite_code}</span>
              </p>
              <form onSubmit={handleAddMember} className="flex gap-3">
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50"
                  placeholder="Email (invite code shown above)"
                  disabled
                />
                <button
                  type="submit"
                  disabled={isAddingMember}
                  className="px-4 py-2 gradient-green-translucent text-white rounded-xl hover:opacity-90 disabled:opacity-50 soft-shadow font-medium transition-all"
                >
                  {isAddingMember ? 'Adding...' : 'Add'}
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-2">
                Note: Members should use the invite code above to join. Email invites coming soon.
              </p>
            </div>
          </div>
          
          {/* Assign Weekly Host (Admin Only) */}
          <div className="glass-card rounded-2xl soft-shadow-lg p-6 border border-white/50">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 tracking-tight">Assign Weekly Host</h2>
            {isAdmin ? (
              <form onSubmit={handleAssignHost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Host
                  </label>
                  <select
                    value={hostUserId}
                    onChange={(e) => setHostUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50"
                    required
                  >
                    <option value="">Select a member</option>
                    {membersWithProfiles.map((member) => (
                      <option key={member.user_id} value={member.user_id}>
                        {member.profile?.display_name || 'Unknown'} {member.user_id === user?.id && '(You)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={assignmentStartDate}
                      onChange={(e) => setAssignmentStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={assignmentEndDate}
                      onChange={(e) => setAssignmentEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="w-full px-4 py-3 gradient-green-translucent text-white rounded-xl hover:opacity-90 disabled:opacity-50 soft-shadow font-medium transition-all"
                >
                  {isAssigning ? 'Assigning...' : 'Assign Host'}
                </button>
              </form>
            ) : (
              <p className="text-gray-700 font-medium text-center">Only group admins can assign weekly hosts.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
