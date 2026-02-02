'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { WorkoutLog } from '@/types'
import { dummyLogs } from '@/lib/dummyData'

interface AppContextType {
  logs: WorkoutLog[]
  setLogs: React.Dispatch<React.SetStateAction<WorkoutLog[]>>
  updateLog: (logId: string, updates: Partial<WorkoutLog>) => void
  addLog: (log: WorkoutLog) => void
  deleteLog: (logId: string) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<WorkoutLog[]>(dummyLogs)
  
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
    <AppContext.Provider value={{ logs, setLogs, updateLog, addLog, deleteLog }}>
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
