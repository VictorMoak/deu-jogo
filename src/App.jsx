import { useState } from 'react'
import { Home } from './pages/Home'
import { GameDay } from './pages/GameDay'
import { PlayersManagement } from './pages/PlayersManagement'
import { GameDayProvider } from './context/GameDayContext'
import { Footer } from './components/Footer'
import { Sidebar } from './components/Sidebar'
import './styles/global.css'
import styles from './App.module.css'

function App() {
  const [currentGameDay, setCurrentGameDay] = useState(null)
  const [showPlayersManagement, setShowPlayersManagement] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleSelectGameDay = (gameDay) => {
    setCurrentGameDay(gameDay)
  }

  const handleBack = () => {
    setCurrentGameDay(null)
  }

  const handleUpdateGameDay = (updatedGameDay) => {
    setCurrentGameDay(updatedGameDay)
  }

  const handleManagePlayers = () => {
    setShowPlayersManagement(true)
    setIsSidebarOpen(false)
  }

  const handleBackFromPlayers = () => {
    setShowPlayersManagement(false)
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <GameDayProvider>
      <div className={styles.app}>
        <Sidebar
          onManagePlayers={handleManagePlayers}
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
        />
        {showPlayersManagement ? (
          <PlayersManagement
            onBack={handleBackFromPlayers}
            onToggleSidebar={toggleSidebar}
          />
        ) : currentGameDay ? (
          <GameDay
            gameDay={currentGameDay}
            onBack={handleBack}
            onUpdateGameDay={handleUpdateGameDay}
            onToggleSidebar={toggleSidebar}
          />
        ) : (
          <Home
            onSelectGameDay={handleSelectGameDay}
            onToggleSidebar={toggleSidebar}
          />
        )}
        <Footer />
      </div>
    </GameDayProvider>
  )
}

export default App
