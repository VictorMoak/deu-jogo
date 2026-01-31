import { createContext, useContext, useState } from 'react'

const GameDayContext = createContext(null)

export function GameDayProvider({ children }) {
  const [currentGameDay, setCurrentGameDay] = useState(null)
  const [loading, setLoading] = useState(false)

  const value = {
    currentGameDay,
    setCurrentGameDay,
    loading,
    setLoading,
  }

  return (
    <GameDayContext.Provider value={value}>
      {children}
    </GameDayContext.Provider>
  )
}

export function useGameDayContext() {
  const context = useContext(GameDayContext)
  if (!context) {
    throw new Error('useGameDayContext must be used within a GameDayProvider')
  }
  return context
}

