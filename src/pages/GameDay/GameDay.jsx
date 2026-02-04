import { useState, useEffect } from 'react'
import { useAttendance } from '../../hooks/useAttendance'
import { useTeams } from '../../hooks/useTeams'
import { useMatches } from '../../hooks/useMatches'
import { useGameDay } from '../../hooks/useGameDay'
import { AttendanceList } from '../../components/AttendanceList'
import { TeamBuilder } from '../../components/TeamBuilder'
import { MatchCard } from '../../components/MatchCard'
import { StandingsTable } from '../../components/StandingsTable'
import { MenuButton } from '../../components/Sidebar'
import styles from './GameDay.module.css'

const TABS = [
  { id: 'attendance', label: '📋 Presença', icon: '📋' },
  { id: 'teams', label: '👥 Times', icon: '👥' },
  { id: 'matches', label: '⚽ Partidas', icon: '⚽' },
  { id: 'standings', label: '🏆 Classificação', icon: '🏆' },
]

export function GameDay({ gameDay, onBack, onUpdateGameDay, onToggleSidebar }) {
  const [activeTab, setActiveTab] = useState('attendance')
  const [confirmFinish, setConfirmFinish] = useState(false)
  const [localGameDay, setLocalGameDay] = useState(gameDay)

  const attendance = useAttendance(gameDay?.id)
  const teams = useTeams(gameDay?.id)
  const matches = useMatches(gameDay?.id)
  const { updateGameDayStatus } = useGameDay()

  // Atualizar localGameDay quando gameDay prop muda
  useEffect(() => {
    setLocalGameDay(gameDay)
  }, [gameDay])

  // Wrapper for updateMatchStatus that also updates gameDay when a match is started
  const handleUpdateMatchStatus = async (matchId, status) => {
    await matches.updateMatchStatus(matchId, status)

    // If match was started and gameDay is not yet in progress, update it
    if (status === 'in_progress' && localGameDay?.status !== 'in_progress') {
      const updatedGameDay = await updateGameDayStatus(localGameDay.id, 'in_progress')
      if (updatedGameDay) {
        setLocalGameDay(updatedGameDay)
        if (onUpdateGameDay) {
          onUpdateGameDay(updatedGameDay)
        }
      }
    }
  }

  const handleFinishGameDay = async () => {
    if (localGameDay && localGameDay.status !== 'finished') {
      const updatedGameDay = await updateGameDayStatus(localGameDay.id, 'finished')
      if (updatedGameDay) {
        setLocalGameDay(updatedGameDay)
        if (onUpdateGameDay) {
          onUpdateGameDay(updatedGameDay)
        }
      }
      setConfirmFinish(false)
      // Go back to home after finishing
      if (onBack) {
        onBack()
      }
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDateShort = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hours, minutes] = timeStr.split(':')
    return `${hours}:${minutes}`
  }

  const getDefaultTitle = (dateStr, timeStr = null) => {
    const dateFormatted = formatDate(dateStr)
    if (timeStr) {
      return `${dateFormatted} - ${formatTime(timeStr)}`
    }
    return dateFormatted
  }

  const getStatusLabel = (status) => {
    const labels = {
      scheduled: 'Agendado',
      in_progress: 'Em Andamento',
      finished: 'Encerrado',
    }
    return labels[status] || status
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'attendance':
        return <AttendanceList {...attendance} gameDayId={gameDay?.id} />
      case 'teams':
        return (
          <TeamBuilder
            {...teams}
            attendance={attendance.attendance}
            gameDayId={gameDay?.id}
          />
        )
      case 'matches':
        return (
          <MatchCard
            {...matches}
            teams={teams.teams}
            gameDayId={gameDay?.id}
            updateMatchStatus={handleUpdateMatchStatus} // Override hook function
          />
        )
      case 'standings':
        return (
          <StandingsTable
            matches={matches.matches}
            teams={teams.teams}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className={styles.gameDay}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <MenuButton onClick={onToggleSidebar} />
          <button onClick={onBack} className="btn btn-secondary">
            ← Voltar
          </button>
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerTitle}>
            {localGameDay?.title || getDefaultTitle(localGameDay?.date, localGameDay?.time)}
          </h1>
          <div className={styles.headerDetails}>
            <div className={styles.headerDateTime}>
              <span className={styles.headerDateFull}>{formatDate(localGameDay?.date)}</span>
              <span className={styles.headerDateShort}>{formatDateShort(localGameDay?.date)}</span>
              {localGameDay?.time && (
                <>
                  <span className={styles.headerSeparator}>•</span>
                  <span className={styles.headerTime}>{formatTime(localGameDay.time)}</span>
                </>
              )}
            </div>
            <span className={styles.headerSeparatorStatus}>•</span>
            <span className={`${styles.headerStatus} badge badge-${localGameDay?.status?.replace('_', '-')}`}>
              {getStatusLabel(localGameDay?.status)}
            </span>
          </div>
        </div>
        {localGameDay?.status !== 'finished' && (
          <button
            onClick={() => setConfirmFinish(true)}
            className={`${styles.finishBtn} btn btn-secondary`}
            title="Encerrar Game Day"
          >
            🏁 Encerrar
          </button>
        )}
        {localGameDay?.status === 'finished' && (
          <div className={styles.headerSpacer}></div>
        )}
      </header>

      <nav className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label.split(' ')[1]}</span>
          </button>
        ))}
      </nav>

      <main className={styles.content}>
        {renderTabContent()}
      </main>

      {/* Confirm Finish Modal */}
      {confirmFinish && (
        <div className={styles.modalOverlay} onClick={() => setConfirmFinish(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Encerrar Game Day?</h3>
            <p className={styles.modalText}>
              <strong>{localGameDay?.title || getDefaultTitle(localGameDay?.date, localGameDay?.time)}</strong>
            </p>
            <p className={styles.modalSubtext}>Tem certeza que deseja encerrar este Game Day? Esta ação não pode ser desfeita.</p>
            <div className={styles.modalActions}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmFinish(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleFinishGameDay}
              >
                🏁 Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

