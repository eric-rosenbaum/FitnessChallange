'use client'

import type { WeekChallenge, StrengthExercise } from '@/types'

interface ChallengeSummaryCardProps {
  challenge: WeekChallenge
  exercises: StrengthExercise[]
  completionCount: { finished: number; total: number }
}

export default function ChallengeSummaryCard({
  challenge,
  exercises,
  completionCount,
}: ChallengeSummaryCardProps) {
  const exerciseList = exercises.map(ex => `${ex.name} ${ex.target_reps}`).join(' · ')
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">This Week&apos;s Challenge</h2>
      <div className="space-y-2">
        <div>
          <span className="text-sm font-medium text-gray-700">Cardio: </span>
          <span className="text-sm text-gray-900">
            {challenge.cardio_target} {challenge.cardio_metric}
          </span>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-700">Strength: </span>
          <span className="text-sm text-gray-900 break-words">{exerciseList}</span>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <span className="text-sm text-gray-600">
            Group completion: {completionCount.finished} / {completionCount.total} finished
          </span>
        </div>
      </div>
    </div>
  )
}
