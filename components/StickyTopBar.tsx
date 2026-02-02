'use client'

import Link from 'next/link'

interface StickyTopBarProps {
  weekLabel: string
  dateRange: string
  hostName: string
  isAdmin?: boolean
}

export default function StickyTopBar({ weekLabel, dateRange, hostName, isAdmin }: StickyTopBarProps) {
  return (
    <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{weekLabel}</div>
            <div className="text-xs text-gray-500 truncate">{dateRange}</div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {isAdmin && (
              <Link
                href="/settings"
                className="px-3 py-2 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                Settings
              </Link>
            )}
            <Link
              href="/log"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Log
            </Link>
          </div>
        </div>
        <div className="text-xs text-gray-600">Host: {hostName}</div>
      </div>
    </div>
  )
}
