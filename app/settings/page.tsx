'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  dummyCurrentUserId,
  dummyGroup,
  dummyMemberships,
  dummyProfiles,
  dummyWeekAssignment,
  getActiveWeek,
} from '@/lib/dummyData'

export default function SettingsPage() {
  const router = useRouter()
  const activeWeek = getActiveWeek()
  const currentUserMembership = dummyMemberships.find(m => m.user_id === dummyCurrentUserId)
  const isAdmin = currentUserMembership?.role === 'admin'
  const [groupName, setGroupName] = useState(dummyGroup.name)
  const [isSaving, setIsSaving] = useState(false)
  
  const [hostUserId, setHostUserId] = useState(activeWeek.week_assignment.host_user_id)
  const [assignmentStartDate, setAssignmentStartDate] = useState(activeWeek.week_assignment.start_date)
  const [assignmentEndDate, setAssignmentEndDate] = useState(activeWeek.week_assignment.end_date)
  const [isAssigning, setIsAssigning] = useState(false)
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center max-w-md">
          <p className="text-gray-600 mb-4">Only admins can access group settings</p>
          <Link href="/" className="text-blue-600 hover:underline">Back to home</Link>
        </div>
      </div>
    )
  }
  
  const members = dummyMemberships.map(m => {
    const profile = dummyProfiles.find(p => p.id === m.user_id)!
    return { ...m, profile }
  })
  
  const handleSaveGroupName = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    alert('Group name saved! (This is dummy data)')
    setIsSaving(false)
  }
  
  const handleAssignHost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hostUserId) {
      alert('Please select a host')
      return
    }
    
    if (new Date(assignmentStartDate) > new Date(assignmentEndDate)) {
      alert('Start date must be before end date')
      return
    }
    
    setIsAssigning(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    alert('Host assigned! (This is dummy data)')
    setIsAssigning(false)
    router.push('/')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline text-sm">← Back to home</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Group Settings</h1>
        </div>
        
        <div className="space-y-6">
          {/* Group Name */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Group Name</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter group name"
              />
              <button
                onClick={handleSaveGroupName}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
          
          {/* Members */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Members</h2>
            <div className="space-y-2">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{member.profile.display_name}</span>
                    {member.user_id === dummyCurrentUserId && (
                      <span className="text-xs text-gray-500 ml-2">(You)</span>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Assign Weekly Host */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assign Weekly Host</h2>
            <form onSubmit={handleAssignHost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Host
                </label>
                <select
                  value={hostUserId}
                  onChange={(e) => setHostUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a member</option>
                  {members.map(member => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.profile.display_name} {member.user_id === dummyCurrentUserId ? '(You)' : ''}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isAssigning}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAssigning ? 'Assigning...' : 'Assign Host'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
