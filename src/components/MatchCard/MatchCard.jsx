import { useState, useEffect } from 'react'
import { Scoreboard } from '../Scoreboard'
import { WhistleIcon } from '../WhistleIcon'
import styles from './MatchCard.module.css'

// Timer component for match duration
function MatchTimer({ startedAt, finishedAt, status }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!startedAt || status !== 'in_progress') return

    // If match is in progress, update every 100ms for smooth milliseconds
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 100)
    return () => clearInterval(interval)
  }, [startedAt, status])

  // Calculate elapsed time based on status
  let elapsed = 0
  if (startedAt) {
    const startTime = new Date(startedAt).getTime()
    if (status === 'finished' && finishedAt) {
      elapsed = new Date(finishedAt).getTime() - startTime
    } else if (status === 'in_progress') {
      elapsed = now - startTime
    }
  }

  if (!startedAt || status === 'pending') return null

  const totalSeconds = Math.floor(elapsed / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const milliseconds = Math.floor((elapsed % 1000) / 10) // Show centiseconds (2 digits)

  const isFinished = status === 'finished'

  return (
    <span className={`${styles.timer} ${isFinished ? styles.timerFinished : ''}`}>
      {isFinished ? <WhistleIcon size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> : '⏱ '}
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      {!isFinished && <span className={styles.timerMs}>.{String(milliseconds).padStart(2, '0')}</span>}
    </span>
  )
}

export function MatchCard({
  matches,
  teams,
  createMatch,
  updateMatchScore,
  updateMatchStatus,
  addMatchStat,
  removeMatchStat,
  deleteMatch
}) {
  const [selectedTeamA, setSelectedTeamA] = useState('')
  const [selectedTeamB, setSelectedTeamB] = useState('')
  const [expandedMatch, setExpandedMatch] = useState(null)
  const [collapsedMatches, setCollapsedMatches] = useState(new Set())
  const [activeTab, setActiveTab] = useState('active') // 'active' or 'finished'
  const [editingMatches, setEditingMatches] = useState(new Set()) // Matches in edit mode
  const [showNewMatch, setShowNewMatch] = useState(false) // Toggle new match form
  const [confirmFinishMatch, setConfirmFinishMatch] = useState(null) // Match to confirm finish
  const [confirmDeleteMatch, setConfirmDeleteMatch] = useState(null) // Match to confirm delete
  const [formError, setFormError] = useState('') // Form validation error

  // Filter matches by tab
  const activeMatches = matches?.filter(m => m.status !== 'finished') || []
  const finishedMatches = matches?.filter(m => m.status === 'finished') || []
  const currentMatches = activeTab === 'active' ? activeMatches : finishedMatches

  const handleCreateMatch = async () => {
    // Validation
    if (!selectedTeamA || !selectedTeamB) {
      setFormError('Selecione os dois times')
      return
    }
    if (selectedTeamA === selectedTeamB) {
      setFormError('Selecione times diferentes')
      return
    }

    setFormError('')
    await createMatch(selectedTeamA, selectedTeamB)
    setSelectedTeamA('')
    setSelectedTeamB('')
    setShowNewMatch(false) // Close form after creating
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      finished: 'Finalizada',
    }
    return labels[status] || status
  }

  // Get captain for a team
  const getCaptain = (team) => {
    if (!team?.team_players) return null
    const captain = team.team_players.find(tp => tp.is_captain)
    return captain?.player?.name || null
  }

  // Format team name with captain for selects
  const formatTeamNameForSelect = (team) => {
    const teamName = team?.name || 'Time'
    const captain = getCaptain(team)
    if (captain) {
      return `${teamName} - ${captain} ©`
    }
    return teamName
  }

  const toggleCollapse = (matchId) => {
    setCollapsedMatches(prev => {
      const newSet = new Set(prev)
      if (newSet.has(matchId)) {
        newSet.delete(matchId)
      } else {
        newSet.add(matchId)
      }
      return newSet
    })
  }

  const isCollapsed = (matchId) => collapsedMatches.has(matchId)

  const expandAll = () => {
    setCollapsedMatches(new Set())
  }

  const collapseAll = () => {
    const allIds = new Set(currentMatches.map(m => m.id))
    setCollapsedMatches(allIds)
  }

  const allCollapsed = currentMatches.length > 0 && currentMatches.every(m => collapsedMatches.has(m.id))

  const toggleEditMode = (matchId) => {
    setEditingMatches(prev => {
      const newSet = new Set(prev)
      if (newSet.has(matchId)) {
        newSet.delete(matchId)
      } else {
        newSet.add(matchId)
      }
      return newSet
    })
  }

  const isEditable = (match) => {
    // If not finished, always editable
    if (match.status !== 'finished') return true
    // If finished, only editable if in edit mode
    return editingMatches.has(match.id)
  }

  const handleFinishMatch = async () => {
    if (confirmFinishMatch) {
      await updateMatchStatus(confirmFinishMatch.id, 'finished')
      setConfirmFinishMatch(null)
    }
  }

  const handleDeleteMatch = async () => {
    if (confirmDeleteMatch) {
      await deleteMatch(confirmDeleteMatch.id)
      setConfirmDeleteMatch(null)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Partidas</h2>
        {!showNewMatch && (
          <button
            className={`${styles.newMatchBtn} btn btn-primary btn-sm`}
            onClick={() => setShowNewMatch(true)}
          >
            ＋ Nova
          </button>
        )}
      </div>

      {/* Create Match */}
      {showNewMatch && (
        <div className={`${styles.createMatch} card`}>
          <div className={styles.createMatchHeader}>
            <h3>Nova Partida</h3>
            <button
              className={styles.closeBtn}
              onClick={() => {
                setShowNewMatch(false)
                setSelectedTeamA('')
                setSelectedTeamB('')
              }}
              title="Fechar"
            >
              ✕
            </button>
          </div>
          <div className={styles.matchForm}>
            <select
              value={selectedTeamA}
              onChange={(e) => {
                setSelectedTeamA(e.target.value)
                setFormError('')
              }}
              className={formError && !selectedTeamA ? styles.selectError : ''}
            >
              <option value="">Selecione</option>
              {teams?.map(team => (
                <option key={team.id} value={team.id} disabled={team.id === selectedTeamB}>
                  {formatTeamNameForSelect(team)}
                </option>
              ))}
            </select>

            <span className={styles.vs}>VS</span>

            <select
              value={selectedTeamB}
              onChange={(e) => {
                setSelectedTeamB(e.target.value)
                setFormError('')
              }}
              className={formError && !selectedTeamB ? styles.selectError : ''}
            >
              <option value="">Selecione</option>
              {teams?.map(team => (
                <option key={team.id} value={team.id} disabled={team.id === selectedTeamA}>
                  {formatTeamNameForSelect(team)}
                </option>
              ))}
            </select>

            <button
              className={`${styles.createBtn} btn btn-primary`}
              onClick={handleCreateMatch}
            >
              Criar
            </button>
          </div>
          {formError && (
            <p className={styles.formError}>{formError}</p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabsRow}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'active' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('active')}
          >
            ⚽ Em Jogo ({activeMatches.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'finished' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('finished')}
          >
            ✅ Finalizadas ({finishedMatches.length})
          </button>
        </div>
        {currentMatches.length > 0 && (
          <button
            className={styles.toggleAllBtn}
            onClick={allCollapsed ? expandAll : collapseAll}
            title={allCollapsed ? 'Expandir todas' : 'Recolher todas'}
          >
            {allCollapsed ? '⊞ Expandir' : '⊟ Recolher'}
          </button>
        )}
      </div>

      {/* Matches List */}
      <div className={styles.matchesList}>
        {currentMatches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{activeTab === 'active' ? '⚽' : '🏆'}</div>
            <p>{activeTab === 'active' ? 'Nenhuma partida em andamento.' : 'Nenhuma partida finalizada.'}</p>
            {activeTab === 'active' && (
              <p className="text-sm text-gray">Selecione dois times acima para criar uma partida.</p>
            )}
          </div>
        ) : (
          currentMatches.map(match => (
            <div key={match.id} className={`${styles.matchCard} ${isCollapsed(match.id) ? styles.collapsed : ''} card`}>
              {isCollapsed(match.id) ? (
                /* Compact single line when collapsed */
                <div className={styles.collapsedRow} onClick={() => toggleCollapse(match.id)}>
                  <div className={styles.collapsedLeft}>
                    <span className={styles.collapseIcon} title="Expandir">＋</span>
                    <span className={styles.matchNumberFull}>Partida {match.match_number}</span>
                    <span className={styles.matchNumberShort}>#{match.match_number}</span>
                  </div>
                  <div className={styles.collapsedCenter}>
                    <span className={styles.teamNameCompact}>{match.team_a?.name}</span>
                    <span className={styles.scoreCompact}>{match.score_a} × {match.score_b}</span>
                    <span className={styles.teamNameCompact}>{match.team_b?.name}</span>
                  </div>
                  <div className={styles.collapsedRight}>
                    <span className={`${styles.matchStatus} badge badge-${match.status.replace('_', '-')}`}>
                      {getStatusLabel(match.status)}
                    </span>
                    <MatchTimer
                      startedAt={match.started_at}
                      finishedAt={match.finished_at}
                      status={match.status}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.matchHeader}>
                  <div className={styles.matchTitleRow}>
                    <div className={styles.matchTitleLeft}>
                      <button
                        className={styles.collapseBtn}
                        onClick={() => toggleCollapse(match.id)}
                        title="Recolher"
                      >
                        −
                      </button>
                      <span className={styles.matchNumber}>
                        <span className={styles.matchNumberFull}>Partida {match.match_number}</span>
                        <span className={styles.matchNumberShort}>#{match.match_number}</span>
                      </span>
                    </div>
                    <div className={styles.matchTitleRight}>
                      <span className={`${styles.matchStatus} badge badge-${match.status.replace('_', '-')}`}>
                        {getStatusLabel(match.status)}
                      </span>
                      <MatchTimer
                        startedAt={match.started_at}
                        finishedAt={match.finished_at}
                        status={match.status}
                      />
                      {match.status === 'finished' && (
                        <button
                          className={`${styles.editBtn} ${editingMatches.has(match.id) ? styles.editBtnActive : ''}`}
                          onClick={() => toggleEditMode(match.id)}
                          title={editingMatches.has(match.id) ? 'Sair do modo edição' : 'Editar partida'}
                        >
                          {editingMatches.has(match.id) ? '✓' : '✏️'}
                        </button>
                      )}
                      <button
                        className={styles.deleteBtn}
                        onClick={() => setConfirmDeleteMatch(match)}
                        title="Excluir partida"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!isCollapsed(match.id) && (
                <>
                  <Scoreboard
                    match={match}
                    onUpdateScore={updateMatchScore}
                    onUpdateStatus={updateMatchStatus}
                    isEditable={isEditable(match)}
                  />

                  <div className={styles.matchActions}>
                    {match.status === 'pending' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => updateMatchStatus(match.id, 'in_progress')}
                      >
                        ▶️ Iniciar
                      </button>
                    )}
                    {match.status === 'in_progress' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setConfirmFinishMatch(match)}
                      >
                        <WhistleIcon size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Finalizar
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
                    >
                      📊 Estatísticas
                    </button>
                  </div>

                  {expandedMatch === match.id && (
                    <div className={styles.stats}>
                      <MatchStats
                        match={match}
                        onAddStat={addMatchStat}
                        onRemoveStat={removeMatchStat}
                        isEditable={isEditable(match)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Confirm Finish Modal */}
      {confirmFinishMatch && (
        <div className={styles.modalOverlay} onClick={() => setConfirmFinishMatch(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Finalizar Partida?</h3>
            <p className={styles.modalText}>
              <strong>{confirmFinishMatch.team_a?.name}</strong> {confirmFinishMatch.score_a} × {confirmFinishMatch.score_b} <strong>{confirmFinishMatch.team_b?.name}</strong>
            </p>
            <p className={styles.modalSubtext}>Tem certeza que deseja finalizar esta partida?</p>
            <div className={styles.modalActions}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmFinishMatch(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleFinishMatch}
              >
                <WhistleIcon size={18} color="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteMatch && (
        <div className={styles.modalOverlay} onClick={() => setConfirmDeleteMatch(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>Excluir Partida?</h3>
            <p className={styles.modalText}>
              <strong>{confirmDeleteMatch.team_a?.name}</strong> {confirmDeleteMatch.score_a} × {confirmDeleteMatch.score_b} <strong>{confirmDeleteMatch.team_b?.name}</strong>
            </p>
            <p className={styles.modalSubtext}>Esta ação não pode ser desfeita. Tem certeza que deseja excluir esta partida?</p>
            <div className={styles.modalActions}>
              <button
                className="btn btn-secondary"
                onClick={() => setConfirmDeleteMatch(null)}
              >
                Cancelar
              </button>
              <button
                className={`btn ${styles.modalDeleteBtn}`}
                onClick={handleDeleteMatch}
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MatchStats({ match, onAddStat, onRemoveStat, isEditable }) {
  const allPlayers = [
    ...(match.team_a?.team_players || []).map(tp => ({ ...tp, teamName: match.team_a?.name })),
    ...(match.team_b?.team_players || []).map(tp => ({ ...tp, teamName: match.team_b?.name })),
  ]

  const getPlayerStat = (playerId, statType) => {
    const stat = match.match_stats?.find(s => s.player_id === playerId)
    return stat?.[statType] || 0
  }

  return (
    <div className={styles.statsContainer}>
      <h4>Estatísticas dos Jogadores</h4>
      <div className={styles.statsTable}>
        <div className={styles.statsHeader}>
          <span>Jogador</span>
          <span>⚽ Gols</span>
          <span>👟 Assist.</span>
          <span>🟨 Amarelo</span>
          <span>🟥 Vermelho</span>
        </div>
        {allPlayers.map(tp => (
          <div key={tp.id} className={styles.statsRow}>
            <span className={styles.playerName}>
              {tp.player?.name}
              <small className="text-gray"> ({tp.teamName})</small>
            </span>
            <StatCounter
              value={getPlayerStat(tp.player_id, 'goals')}
              onAdd={() => onAddStat(match.id, tp.player_id, 'goals')}
              onRemove={() => onRemoveStat(match.id, tp.player_id, 'goals')}
              disabled={!isEditable}
            />
            <StatCounter
              value={getPlayerStat(tp.player_id, 'assists')}
              onAdd={() => onAddStat(match.id, tp.player_id, 'assists')}
              onRemove={() => onRemoveStat(match.id, tp.player_id, 'assists')}
              disabled={!isEditable}
            />
            <StatCounter
              value={getPlayerStat(tp.player_id, 'yellow_cards')}
              onAdd={() => onAddStat(match.id, tp.player_id, 'yellow_cards')}
              onRemove={() => onRemoveStat(match.id, tp.player_id, 'yellow_cards')}
              disabled={!isEditable}
            />
            <StatCounter
              value={getPlayerStat(tp.player_id, 'red_cards')}
              onAdd={() => onAddStat(match.id, tp.player_id, 'red_cards')}
              onRemove={() => onRemoveStat(match.id, tp.player_id, 'red_cards')}
              disabled={!isEditable}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCounter({ value, onAdd, onRemove, disabled }) {
  return (
    <div className={`${styles.statCounter} ${disabled ? styles.statCounterDisabled : ''}`}>
      <button onClick={onRemove} disabled={disabled || value <= 0}>−</button>
      <span>{value}</span>
      <button onClick={onAdd} disabled={disabled}>+</button>
    </div>
  )
}
