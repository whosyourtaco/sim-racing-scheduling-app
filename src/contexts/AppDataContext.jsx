import React, { createContext, useContext } from 'react'
import { useAppData } from '../hooks/useAppData.js'

const AppDataContext = createContext()

export function AppDataProvider({ children }) {
  const appData = useAppData()

  return (
    <AppDataContext.Provider value={appData}>
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppDataContext() {
  const context = useContext(AppDataContext)
  if (!context) {
    throw new Error('useAppDataContext must be used within an AppDataProvider')
  }
  return context
}