'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import { useUserGroup } from '@/lib/hooks/useUserGroup'
import LoadingSpinner from '@/components/LoadingSpinner'
import {
  getGroup,
  getGroupMemberships,
  updateGroupName,
  removeMember,
  createWeekAssignment,
  updateWeekAssignment,
  getActiveWeek,
  getUpcomingAssignments,
  getAllAssignments,
  getChallengeForAssignment,
  deleteWeekAssignment,
} from '@/lib/db/queries'
import type { GroupMembership, ActiveWeek, WeekAssignment } from '@/types'

// Helper function to extract date in YYYY-MM-DD format, handling timezone issues
// This function ensures we always get the date as YYYY-MM-DD without timezone conversion
function formatDateForInput(dateString: string): string {
  if (!dateString) return ''
  
  // Extract just the date part (YYYY-MM-DD) from any format
  // Handle formats like "2026-02-09", "2026-02-09T00:00:00", "2026-02-09T00:00:00.000Z", etc.
  const dateMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/)
  if (dateMatch) {
    return dateMatch[1]
  }
  
  // If no match, return as-is (shouldn't happen with valid dates)
  console.warn('[formatDateForInput] Unexpected date format:', dateString)
  return dateString
}

// Helper function to format date for display (e.g., "Feb 8")
// Parses date as local time to avoid timezone conversion issues
function formatDateForDisplay(dateString: string): string {
  if (!dateString) return ''
  
  // Extract date part (YYYY-MM-DD)
  const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (dateMatch) {
    const [, year, month, day] = dateMatch
    // Create date in local timezone (not UTC) to avoid day shift
    // Using Date(year, month-1, day) creates a date in local timezone
    const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    return localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  // Fallback: try standard parsing (may have timezone issues)
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useApp()
  const { group, membership } = useUserGroup()
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSupabase(createClient())
    }
  }, [])
  
  const [memberships, setMemberships] = useState<GroupMembership[]>([])
  const [groupName, setGroupName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [activeWeek, setActiveWeek] = useState<ActiveWeek | null>(null)
  const [upcomingAssignments, setUpcomingAssignments] = useState<WeekAssignment[]>([])
  const [assignmentChallenges, setAssignmentChallenges] = useState<Record<string, { challenge: any; exercises: any[] } | null>>({})
  
  // Form state for upcoming assignments
  const [newAssignmentHost, setNewAssignmentHost] = useState('')
  const [newAssignmentStartDate, setNewAssignmentStartDate] = useState(() => {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    return nextWeek.toISOString().split('T')[0]
  })
  const [newAssignmentEndDate, setNewAssignmentEndDate] = useState(() => {
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const endWeek = new Date(nextWeek)
    endWeek.setDate(endWeek.getDate() + 6)
    return endWeek.toISOString().split('T')[0]
  })
  const [isAddingAssignment, setIsAddingAssignment] = useState(false)
  
  // Form state for changing current host
  const [editingCurrentHost, setEditingCurrentHost] = useState(false)
  const [newCurrentHost, setNewCurrentHost] = useState('')
  const [isUpdatingHost, setIsUpdatingHost] = useState(false)
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null)
  
  // Form state for editing current week dates
  const [editingCurrentDates, setEditingCurrentDates] = useState(false)
  const [newCurrentStartDate, setNewCurrentStartDate] = useState('')
  const [newCurrentEndDate, setNewCurrentEndDate] = useState('')
  const [isUpdatingDates, setIsUpdatingDates] = useState(false)
  
  const currentUserMembership = memberships.find(m => m.user_id === user?.id)
  const isAdmin = currentUserMembership?.role === 'admin'
  const hasActiveWeek = !!activeWeek?.week_assignment
  
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
        setActiveWeek(week)
        if (week?.week_assignment) {
          setNewCurrentHost(week.week_assignment.host_user_id)
          // Ensure dates are in YYYY-MM-DD format, handling timezone issues
          const formattedStart = formatDateForInput(week.week_assignment.start_date)
          const formattedEnd = formatDateForInput(week.week_assignment.end_date)
          console.log('[Settings] Setting initial dates from database:', {
            rawStart: week.week_assignment.start_date,
            rawEnd: week.week_assignment.end_date,
            formattedStart,
            formattedEnd,
          })
          setNewCurrentStartDate(formattedStart)
          setNewCurrentEndDate(formattedEnd)
        }
      })
      
      // Fetch upcoming assignments (exclude current if exists)
      getActiveWeek(group.id).then((week) => {
        const currentAssignmentId = week?.week_assignment?.id
        getUpcomingAssignments(group.id, currentAssignmentId).then(async (assignments) => {
          setUpcomingAssignments(assignments)
          // Fetch challenges for each assignment
          const challenges: Record<string, { challenge: any; exercises: any[] } | null> = {}
          for (const assignment of assignments) {
            try {
              const { challenge, exercises } = await getChallengeForAssignment(assignment.id)
              challenges[assignment.id] = challenge ? { challenge, exercises } : null
            } catch (error) {
              challenges[assignment.id] = null
            }
          }
          setAssignmentChallenges(challenges)
        })
      })
    }
  }, [group])
  
  const [membersWithProfiles, setMembersWithProfiles] = useState<any[]>([])
  
  useEffect(() => {
    if (!supabase) return
    
    async function fetchProfiles() {
      if (!supabase) return
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
  
  
  const handleUpdateCurrentHost = async () => {
    if (!group || !user || !isAdmin || !activeWeek?.week_assignment) return
    
    if (!newCurrentHost) {
      alert('Please select a host')
      return
    }
    
    setIsUpdatingHost(true)
    try {
      await updateWeekAssignment(
        activeWeek.week_assignment.id,
        newCurrentHost,
        user.id
      )
      
      // Refresh data immediately
      const updatedWeek = await getActiveWeek(group.id)
      setActiveWeek(updatedWeek)
      setEditingCurrentHost(false)
      setNewCurrentHost(updatedWeek?.week_assignment?.host_user_id || '')
      
      alert('Host updated!')
    } catch (error: any) {
      console.error('[Settings] Error updating host:', error)
      alert('Error: ' + (error.message || 'Failed to update host'))
      setIsUpdatingHost(false)
    }
  }
  
  const handleUpdateCurrentDates = async () => {
    if (!group || !user || !activeWeek?.week_assignment) return
    
    // Only admin can update dates
    if (!isAdmin) {
      alert('Only the admin can update dates')
      return
    }
    
    if (!newCurrentStartDate || !newCurrentEndDate) {
      alert('Please fill in both start and end dates')
      return
    }
    
    if (new Date(newCurrentStartDate) > new Date(newCurrentEndDate)) {
      alert('Start date must be before end date')
      return
    }
    
    setIsUpdatingDates(true)
    try {
      // Get the actual values from the input elements to ensure we have the correct dates
      // This is a defensive measure in case state and DOM are out of sync
      const startInput = document.querySelector('input[type="date"]:nth-of-type(1)') as HTMLInputElement
      const endInput = document.querySelector('input[type="date"]:nth-of-type(2)') as HTMLInputElement
      
      // Use input values if available, otherwise fall back to state
      const actualStartDate = startInput?.value || newCurrentStartDate
      const actualEndDate = endInput?.value || newCurrentEndDate
      
      // Log what we're sending
      console.log('[Settings] Sending dates:', {
        stateStartDate: newCurrentStartDate,
        stateEndDate: newCurrentEndDate,
        inputStartDate: startInput?.value,
        inputEndDate: endInput?.value,
        actualStartDate,
        actualEndDate,
        startDateType: typeof actualStartDate,
        endDateType: typeof actualEndDate,
      })
      
      const result = await updateWeekAssignment(
        activeWeek.week_assignment.id,
        activeWeek.week_assignment.host_user_id,
        user.id,
        actualStartDate,
        actualEndDate
      )
      
      console.log('[Settings] Update result:', result)
      console.log('[Settings] Result dates:', {
        start_date: result.start_date,
        end_date: result.end_date,
      })
      
      // Refresh data immediately - wait a bit for database to update
      await new Promise(resolve => setTimeout(resolve, 100))
      const updatedWeek = await getActiveWeek(group.id)
      console.log('[Settings] Updated week data:', updatedWeek)
      console.log('[Settings] Updated week assignment dates:', {
        start_date: updatedWeek?.week_assignment?.start_date,
        end_date: updatedWeek?.week_assignment?.end_date,
        formattedStart: updatedWeek?.week_assignment ? formatDateForInput(updatedWeek.week_assignment.start_date) : null,
        formattedEnd: updatedWeek?.week_assignment ? formatDateForInput(updatedWeek.week_assignment.end_date) : null,
      })
      
      if (updatedWeek?.week_assignment) {
        // Force a re-render by creating a new object
        setActiveWeek({
          ...updatedWeek,
          week_assignment: {
            ...updatedWeek.week_assignment,
            start_date: formatDateForInput(updatedWeek.week_assignment.start_date),
            end_date: formatDateForInput(updatedWeek.week_assignment.end_date),
          }
        })
        // Ensure dates are in YYYY-MM-DD format, handling timezone issues
        const formattedStart = formatDateForInput(updatedWeek.week_assignment.start_date)
        const formattedEnd = formatDateForInput(updatedWeek.week_assignment.end_date)
        console.log('[Settings] Setting dates in state:', { 
          rawStart: updatedWeek.week_assignment.start_date,
          rawEnd: updatedWeek.week_assignment.end_date,
          formattedStart, 
          formattedEnd 
        })
        setNewCurrentStartDate(formattedStart)
        setNewCurrentEndDate(formattedEnd)
        setEditingCurrentDates(false)
        alert('Dates updated!')
        // Refresh the page to update dashboard
        router.refresh()
      } else {
        throw new Error('Failed to fetch updated week data')
      }
    } catch (error: any) {
      console.error('[Settings] Error updating dates:', error)
      alert('Error: ' + (error.message || 'Failed to update dates'))
    } finally {
      setIsUpdatingDates(false)
    }
  }
  
  const handleAddUpcomingAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!group || !user || !isAdmin) return
    
    if (!newAssignmentHost || !newAssignmentStartDate || !newAssignmentEndDate) {
      alert('Please fill in all fields')
      return
    }
    
    // Check for overlapping dates
    try {
      const allAssignments = await getAllAssignments(group.id)
      
      // Helper to parse date string as local date (YYYY-MM-DD)
      const parseLocalDate = (dateStr: string): Date => {
        const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (dateMatch) {
          const [, year, month, day] = dateMatch
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        }
        return new Date(dateStr)
      }
      
      // Check if new dates overlap with any existing assignment
      const newStart = parseLocalDate(newAssignmentStartDate)
      const newEnd = parseLocalDate(newAssignmentEndDate)
      
      for (const assignment of allAssignments) {
        const existingStart = parseLocalDate(assignment.start_date)
        const existingEnd = parseLocalDate(assignment.end_date)
        
        // Check for overlap: new assignment overlaps if:
        // - newStart <= existingEnd AND newEnd >= existingStart
        if (newStart <= existingEnd && newEnd >= existingStart) {
          // Get host name for the conflicting assignment
          const conflictingHost = membersWithProfiles.find(
            m => m.user_id === assignment.host_user_id
          )?.profile?.display_name || 'Unknown'
          
          // Format dates for display (using the existing helper function)
          const conflictingStart = formatDateForDisplay(assignment.start_date)
          const conflictingEnd = formatDateForDisplay(assignment.end_date)
          
          alert(`Cannot add assignment: these dates overlap with ${conflictingHost}'s assignment from ${conflictingStart} to ${conflictingEnd}`)
          return
        }
      }
    } catch (error: any) {
      console.error('[Settings] Error checking for overlaps:', error)
      // Continue with creation if overlap check fails (shouldn't happen, but don't block user)
    }
    
    setIsAddingAssignment(true)
    try {
      await createWeekAssignment(
        group.id,
        newAssignmentStartDate,
        newAssignmentEndDate,
        newAssignmentHost,
        user.id
      )
      
      // Refresh active week (in case the new assignment is the current one)
      const updatedWeek = await getActiveWeek(group.id)
      setActiveWeek(updatedWeek)
      
      // Refresh upcoming assignments (exclude current)
      const currentAssignmentId = updatedWeek?.week_assignment?.id
      const updated = await getUpcomingAssignments(group.id, currentAssignmentId)
      setUpcomingAssignments(updated)
      
      // Reset form
      setNewAssignmentHost('')
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const endWeek = new Date(nextWeek)
      endWeek.setDate(endWeek.getDate() + 6)
      setNewAssignmentStartDate(nextWeek.toISOString().split('T')[0])
      setNewAssignmentEndDate(endWeek.toISOString().split('T')[0])
      
      alert('Assignment added!')
      setIsAddingAssignment(false)
    } catch (error: any) {
      console.error('[Settings] Error adding upcoming assignment:', error)
      alert('Error: ' + (error.message || 'Failed to add assignment'))
      setIsAddingAssignment(false)
    }
  }
  
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this upcoming assignment?')) {
      return
    }
    
    if (!group) return
    
    setDeletingAssignmentId(assignmentId)
    try {
      await deleteWeekAssignment(assignmentId)
      
      // Refresh active week (in case we deleted the current one)
      const updatedWeek = await getActiveWeek(group.id)
      setActiveWeek(updatedWeek)
      
      // Refresh upcoming assignments (exclude current)
      const currentAssignmentId = updatedWeek?.week_assignment?.id
      const updated = await getUpcomingAssignments(group.id, currentAssignmentId)
      setUpcomingAssignments(updated)
      
      alert('Assignment deleted!')
    } catch (error: any) {
      console.error('[Settings] Error deleting assignment:', error)
      alert('Error: ' + (error.message || 'Failed to delete assignment'))
    } finally {
      setDeletingAssignmentId(null)
    }
  }
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl soft-shadow-lg p-6 text-center max-w-md border border-red-100/30">
          <p className="text-gray-700 mb-4 font-medium">No group found</p>
          <Link href="/" className="text-[#8B4513] hover:text-[#6B4423] hover:underline font-medium">Back to home</Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/" className="text-[#8B4513] hover:text-[#6B4423] hover:underline text-sm font-medium">← Back to home</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 tracking-tight">Group Settings</h1>
        </div>
        
        <div className="space-y-6">
          {/* Group Name */}
          <div className="glass-card rounded-2xl soft-shadow-lg p-6 border border-red-100/30">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 tracking-tight">Group Name</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
                style={{ fontSize: '16px' }}
                placeholder="Group name"
              />
              <button
                onClick={handleSaveGroupName}
                disabled={isSaving}
                className="px-4 py-2 bg-[#8B4513] text-white rounded-xl hover:opacity-90 disabled:opacity-50 soft-shadow font-medium transition-all"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          
          {/* Members */}
          <div className="glass-card rounded-2xl soft-shadow-lg p-6 border border-red-100/30">
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
                    <span className="text-xs px-2 py-1 bg-green-50 text-[#8B4513] rounded-lg font-medium border border-green-200/50">
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
                Share this invite code with others to let them join your group:
              </p>
              <div className="p-4 bg-green-50/50 border border-green-200/50 rounded-xl">
                <p className="text-center font-mono text-2xl font-bold text-[#8B4513] tracking-wider">
                  {group.invite_code}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Members can use this code on the join page to join your group
              </p>
            </div>
          </div>
          
          {/* Current Week Assignment */}
          {hasActiveWeek && activeWeek?.week_assignment && (
            <div className="glass-card rounded-2xl soft-shadow-lg p-6 border border-red-100/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800 tracking-tight">Current Week Assignment</h2>
                <div className="flex gap-2">
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setEditingCurrentDates(!editingCurrentDates)
                        if (!editingCurrentDates && activeWeek.week_assignment) {
                          // Ensure dates are in YYYY-MM-DD format, handling timezone issues
                          setNewCurrentStartDate(formatDateForInput(activeWeek.week_assignment.start_date))
                          setNewCurrentEndDate(formatDateForInput(activeWeek.week_assignment.end_date))
                        }
                      }}
                      className="text-sm text-[#8B4513] hover:text-[#6B4423] hover:underline font-medium"
                    >
                      {editingCurrentDates ? 'Cancel' : 'Edit Dates'}
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setEditingCurrentHost(!editingCurrentHost)
                        setNewCurrentHost(activeWeek.week_assignment.host_user_id)
                      }}
                      className="text-sm text-[#8B4513] hover:text-[#6B4423] hover:underline font-medium"
                    >
                      {editingCurrentHost ? 'Cancel' : 'Change Host'}
                    </button>
                  )}
                </div>
              </div>
              
              {!editingCurrentHost && !editingCurrentDates ? (
                <div className="space-y-2">
                  <p className="text-gray-700">
                    <span className="font-medium">Host:</span> {activeWeek.host_name || 'Unknown'}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-medium">Week:</span> {formatDateForDisplay(activeWeek.week_assignment.start_date)} - {formatDateForDisplay(activeWeek.week_assignment.end_date)}
                  </p>
                  {activeWeek.challenge ? (
                    <div className="flex items-center justify-between">
                      <p className="text-[#8B4513] font-medium">
                        ✓ Challenge has been created
                      </p>
                      <Link
                        href={`/create-challenge`}
                        className="ml-3 px-3 py-1.5 text-sm text-[#8B4513] hover:text-[#6B4423] hover:bg-green-50/50 rounded-lg font-medium transition-colors"
                      >
                        Edit Exercises
                      </Link>
                    </div>
                  ) : (
                    <p className="text-amber-600 font-medium">
                      ⏳ Waiting for host to create challenge
                    </p>
                  )}
                </div>
              ) : editingCurrentDates && isAdmin ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={newCurrentStartDate || ''}
                        onChange={(e) => {
                          const value = e.target.value
                          console.log('[Settings] Start date onChange:', { value, previous: newCurrentStartDate })
                          setNewCurrentStartDate(value)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50 text-base"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={newCurrentEndDate}
                        onChange={(e) => {
                          const newValue = e.target.value
                          console.log('[Settings] End date input onChange:', {
                            newValue,
                            previousValue: newCurrentEndDate,
                            inputValue: e.target.value,
                            inputElementValue: (e.target as HTMLInputElement).value,
                          })
                          // Ensure we're using the exact value from the input
                          setNewCurrentEndDate(e.target.value)
                        }}
                        onBlur={(e) => {
                          const input = e.target as HTMLInputElement
                          console.log('[Settings] End date input onBlur:', {
                            inputValue: input.value,
                            stateValue: newCurrentEndDate,
                            matches: input.value === newCurrentEndDate,
                          })
                          // Sync state with actual input value on blur
                          if (input.value !== newCurrentEndDate) {
                            console.log('[Settings] Syncing end date state with input value')
                            setNewCurrentEndDate(input.value)
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50 text-base"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Note: The week will end at 11:59 PM on the selected end date.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditingCurrentDates(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        console.log('[Settings] Update button clicked, current state:', {
                          newCurrentStartDate,
                          newCurrentEndDate,
                        })
                        handleUpdateCurrentDates()
                      }}
                      disabled={isUpdatingDates || !newCurrentStartDate || !newCurrentEndDate}
                      className="flex-1 px-4 py-3 bg-[#8B4513] text-white rounded-xl hover:opacity-90 disabled:opacity-50 soft-shadow font-medium transition-all"
                    >
                      {isUpdatingDates ? 'Updating...' : 'Update Dates'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Host
                    </label>
                    <select
                      value={newCurrentHost}
                      onChange={(e) => setNewCurrentHost(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50 text-base"
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
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditingCurrentHost(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateCurrentHost}
                      disabled={isUpdatingHost || !newCurrentHost}
                      className="flex-1 px-4 py-3 bg-[#8B4513] text-white rounded-xl hover:opacity-90 disabled:opacity-50 soft-shadow font-medium transition-all"
                    >
                      {isUpdatingHost ? 'Updating...' : 'Update Host'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Upcoming Assignments (Visible to All Users) */}
          <div className="glass-card rounded-2xl soft-shadow-lg p-6 border border-red-100/30">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 tracking-tight">Upcoming Assignments</h2>
            
            {/* List of upcoming assignments */}
            {upcomingAssignments.length > 0 ? (
              <div className="space-y-3 mb-6">
                {upcomingAssignments.map((assignment) => {
                  const hostMember = membersWithProfiles.find(m => m.user_id === assignment.host_user_id)
                  const hasChallenge = assignmentChallenges[assignment.id]?.challenge
                  const challengeData = assignmentChallenges[assignment.id]
                  const isCurrentUser = assignment.host_user_id === user?.id
                  return (
                    <div key={assignment.id} className="p-3 bg-gray-50/50 rounded-xl border border-gray-200/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {hostMember?.profile?.display_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDateForDisplay(assignment.start_date)} - {formatDateForDisplay(assignment.end_date)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {isCurrentUser && (
                            <Link
                              href={`/create-challenge?assignmentId=${assignment.id}`}
                              className="px-3 py-1.5 text-sm text-[#8B4513] hover:text-[#6B4423] hover:bg-green-50/50 rounded-lg font-medium transition-colors"
                            >
                              {hasChallenge ? 'Edit' : 'Set'} Exercises
                            </Link>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              disabled={deletingAssignmentId === assignment.id}
                              className="px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50/50 text-sm rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              {deletingAssignmentId === assignment.id ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </div>
                      {hasChallenge && challengeData ? (
                        <div className="mt-3 pt-3 border-t border-gray-200/50">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Challenge Details:</p>
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">Cardio:</span> {challengeData.challenge.cardio_target} {challengeData.challenge.cardio_metric}
                          </p>
                          {challengeData.exercises.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs font-medium text-gray-600 mb-1">Strength Exercises:</p>
                              <ul className="text-xs text-gray-600 space-y-0.5">
                                {challengeData.exercises.map((ex: any) => (
                                  <li key={ex.id}>
                                    • {ex.name}: {ex.target_reps} reps
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          Exercises not set yet
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-6">No upcoming assignments</p>
            )}
            
            {/* Form to add new upcoming assignment (Admin Only) */}
            {isAdmin && (
              <div className="pt-4 border-t border-gray-200/50">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 tracking-tight">Add Upcoming Assignment</h3>
                <form onSubmit={handleAddUpcomingAssignment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Host
                    </label>
                    <select
                      value={newAssignmentHost}
                      onChange={(e) => setNewAssignmentHost(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
                      style={{ fontSize: '16px' }}
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
                        value={newAssignmentStartDate}
                        onChange={(e) => setNewAssignmentStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
                        style={{ fontSize: '16px' }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={newAssignmentEndDate}
                        onChange={(e) => setNewAssignmentEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B4513] focus:border-[#8B4513] bg-white/50"
                        style={{ fontSize: '16px' }}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingAssignment}
                    className="w-full px-4 py-3 bg-[#8B4513] text-white rounded-xl hover:opacity-90 disabled:opacity-50 soft-shadow font-medium transition-all"
                  >
                    {isAddingAssignment ? 'Adding...' : 'Add Assignment'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
