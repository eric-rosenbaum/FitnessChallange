'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WorkoutLog, WeekChallenge, StrengthExercise } from '@/types'
import { getWorkoutLogs } from '@/lib/db/queries'

interface AppContextType {
  logs: WorkoutLog[]
  setLogs: React.Dispatch<React.SetStateAction<WorkoutLog[]>>
  updateLog: (logId: string, updates: Partial<WorkoutLog>) => void
  addLog: (log: WorkoutLog) => void
  deleteLog: (logId: string) => void
  refreshLogs: (challengeId: string) => Promise<void>
  challenge: WeekChallenge | null
  setChallenge: (challenge: WeekChallenge | null) => void
  exercises: StrengthExercise[]
  setExercises: (exercises: StrengthExercise[]) => void
  user: any | null
  loading: boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [challenge, setChallenge] = useState<WeekChallenge | null>(null)
  const [exercises, setExercises] = useState<StrengthExercise[]>([])
  const [user, setUser] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])
  
  const refreshLogs = async (challengeId: string) => {
    try {
      const logsData = await getWorkoutLogs(challengeId)
      setLogs(logsData)
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }
  
  const updateLog = (logId: string, updates: Partial<WorkoutLog>) => {
    setLogs(prev => prev.map(log => 
      log.id === logId ? { ...log, ...updates } : log
    ))
  }
  
  const addLog = (log: WorkoutLog) => {
    setLogs(prev => [...prev, log])
  }
  
  const deleteLog = (logId: string) => {
    setLogs(prev => prev.filter(log => log.id !== logId))
  }
  
  return (
    <AppContext.Provider value={{ 
      logs, 
      setLogs, 
      updateLog, 
      addLog, 
      deleteLog,
      refreshLogs,
      challenge,
      setChallenge,
      exercises,
      setExercises,
      user,
      loading,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
