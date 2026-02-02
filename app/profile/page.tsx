'use client'

import Link from 'next/link'
import { dummyCurrentUserId, dummyProfiles } from '@/lib/dummyData'

export default function ProfilePage() {
  const currentUser = dummyProfiles.find(p => p.id === dummyCurrentUserId)
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Link href="/" className="text-blue-600 hover:underline text-sm">← Back to home</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Profile</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                defaultValue={currentUser?.display_name || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your display name"
              />
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
