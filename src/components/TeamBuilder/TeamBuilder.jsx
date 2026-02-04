import { useState } from 'react'
import styles from './TeamBuilder.module.css'

const DEFAULT_TEAMS = ['Time A', 'Time B', 'Time C', 'Time D']

export function TeamBuilder({
  teams,
  attendance,
  createTeam,
  updateTeam,
  deleteTeam,
  addPlayerToTeam,
  removePlayerFromTeam,
  updateTeamPlayer,
}) {
  const [editingTeam, setEditingTeam] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [editingNumber, setEditingNumber] = useState(null)
  const [playerNumber, setPlayerNumber] = useState('')
  const [draggedPlayer, setDraggedPlayer] = useState(null)

  // Sort team players: captain first, then by name
  const sortTeamPlayers = (players) => {
    if (!players) return []
    return [...players].sort((a, b) => {
      if (a.is_captain && !b.is_captain) return -1
      if (!a.is_captain && b.is_captain) return 1
      return (a.player?.name || '').localeCompare(b.player?.name || '')
    })
  }

  // Get players not assigned to any team
  const assignedPlayerIds = teams?.flatMap(t =>
    t.team_players?.map(tp => tp.player_id) || []
  ) || []

  const availablePlayers = attendance?.filter(
    a => !assignedPlayerIds.includes(a.player_id)
  ) || []

  const handleCreateDefaultTeams = async () => {
    for (let i = 0; i < DEFAULT_TEAMS.length; i++) {
      await createTeam(DEFAULT_TEAMS[i], i + 1)
    }
  }

  const handleCreateTeam = async () => {
    const name = `Time ${String.fromCharCode(65 + (teams?.length || 0))}`
    await createTeam(name, (teams?.length || 0) + 1)
  }

  const handleUpdateTeamName = async (teamId) => {
    if (teamName.trim()) {
      await updateTeam(teamId, { name: teamName.trim() })
    }
    setEditingTeam(null)
    setTeamName('')
  }

  // Drag and Drop handlers - SIMPLES como PlayersManagement
  const handleDragStart = (e, player, fromTeamId = null) => {
    // Armazenar objeto com todas as informações necessárias
    const dragData = {
      player: player,
      playerId: player.player_id || player.id,
      fromTeamId: fromTeamId || null,
      teamPlayerId: player.id || null
    }
    setDraggedPlayer(dragData)

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move'
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move'
    }
    e.currentTarget.classList.add(styles.dragOver)
  }

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove(styles.dragOver)
  }

  const handleDrop = async (e, teamId) => {
    e.preventDefault()
    e.currentTarget.classList.remove(styles.dragOver)

    if (!draggedPlayer) return

    const playerId = draggedPlayer.playerId
    const fromTeamId = draggedPlayer.fromTeamId
    const teamPlayerId = draggedPlayer.teamPlayerId

    if (!playerId) return

    // Se for o mesmo time, não fazer nada
    if (fromTeamId === teamId) {
      setDraggedPlayer(null)
      return
    }

    // Remover do time anterior se existir
    if (fromTeamId && teamPlayerId) {
      await removePlayerFromTeam(teamPlayerId)
    }

    // Adicionar ao novo time
    await addPlayerToTeam(teamId, playerId)

    setDraggedPlayer(null)
  }

  const handleDropToAvailable = async (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove(styles.dragOver)

    if (!draggedPlayer) return

    const teamPlayerId = draggedPlayer.teamPlayerId

    if (teamPlayerId) {
      await removePlayerFromTeam(teamPlayerId)
    }

    setDraggedPlayer(null)
  }

  const toggleCaptain = async (teamPlayer) => {
    // Only allow setting as captain, not unsetting (there must always be a captain)
    if (!teamPlayer.is_captain) {
      await updateTeamPlayer(teamPlayer.id, { is_captain: true })
    }
  }

  const handleUpdateNumber = async (teamPlayerId) => {
    const num = playerNumber.trim() ? parseInt(playerNumber, 10) : null
    await updateTeamPlayer(teamPlayerId, { number: num })
    setEditingNumber(null)
    setPlayerNumber('')
  }


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Divisão de Times</h2>
        <div className={styles.actions}>
          {(!teams || teams.length === 0) && (
            <button
              className="btn btn-primary"
              onClick={handleCreateDefaultTeams}
            >
              🎯 Criar Times Padrão
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={handleCreateTeam}
          >
            + Adicionar Time
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {/* Available Players */}
        <div
          className={`${styles.availablePlayers} card`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDropToAvailable}
        >
          <h3>Jogadores Disponíveis ({availablePlayers.length})</h3>
          <div className={styles.playerList}>
            {availablePlayers.length === 0 ? (
              <p className="text-gray text-sm">Todos os jogadores foram distribuídos.</p>
            ) : (
              availablePlayers.map(item => (
                <div
                  key={item.id}
                  className={styles.playerChip}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                >
                  <span>{item.player?.name}</span>
                  <span className={`badge badge-${item.player?.type}`}>
                    {item.player?.type === 'mensalista' ? 'M' : 'A'}
                  </span>
                  {(item.player?.primary_position || item.player?.secondary_position) && (
                    <div className={styles.playerPositionRow}>
                      {item.player?.primary_position && (
                        <span className={`${styles.positionBadgeAvailable} ${styles.positionPrimary}`}>
                          {item.player.primary_position}
                        </span>
                      )}
                      {item.player?.secondary_position && (
                        <span className={`${styles.positionBadgeAvailable} ${styles.positionSecondary}`}>
                          {item.player.secondary_position}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Teams Grid */}
        <div className={styles.teamsGrid}>
          {teams?.map(team => (
            <div
              key={team.id}
              className={`${styles.teamCard} card`}
              data-team-id={team.id}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, team.id)}
            >
              <div className={styles.teamHeader}>
                {editingTeam === team.id ? (
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    onBlur={() => handleUpdateTeamName(team.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateTeamName(team.id)}
                    autoFocus
                    className={styles.teamNameInput}
                  />
                ) : (
                  <h3
                    onClick={() => {
                      setEditingTeam(team.id)
                      setTeamName(team.name)
                    }}
                    className={styles.teamName}
                  >
                    {team.name}
                  </h3>
                )}
                <div className={styles.teamActions}>
                  <span className={styles.playerCount}>
                    {team.team_players?.length || 0}
                  </span>
                  <button
                    className="btn btn-icon btn-secondary btn-sm"
                    onClick={() => deleteTeam(team.id)}
                    title="Remover time"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className={styles.teamPlayers}>
                {(!team.team_players || team.team_players.length === 0) ? (
                  <p className={styles.dropHint}>Arraste jogadores aqui</p>
                ) : (
                  sortTeamPlayers(team.team_players).map(tp => (
                    <div
                      key={tp.id}
                      className={`${styles.teamPlayer} ${tp.is_captain ? styles.captain : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, tp, team.id)}
                    >
                      {editingNumber === tp.id ? (
                        <input
                          type="number"
                          value={playerNumber}
                          onChange={(e) => setPlayerNumber(e.target.value)}
                          onBlur={() => handleUpdateNumber(tp.id)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUpdateNumber(tp.id)}
                          autoFocus
                          className={styles.numberInput}
                          placeholder="#"
                          min="1"
                          max="99"
                        />
                      ) : (
                        <span
                          className={styles.playerNumber}
                          onClick={() => {
                            setEditingNumber(tp.id)
                            setPlayerNumber(tp.number?.toString() || '')
                          }}
                          title="Clique para editar número"
                        >
                          {tp.number || '#'}
                        </span>
                      )}
                      <span className={styles.playerInfo}>
                        <div className={styles.playerNameContainer}>
                          <div className={styles.playerNameRow}>
                            <span>{tp.player?.name}</span>
                          </div>
                          {(tp.player?.primary_position || tp.player?.secondary_position) && (
                            <div className={styles.playerPositionRow}>
                              {tp.player?.primary_position && (
                                <span className={`${styles.positionBadgeTeam} ${styles.positionPrimary}`}>
                                  {tp.player.primary_position}
                                </span>
                              )}
                              {tp.player?.secondary_position && (
                                <span className={`${styles.positionBadgeTeam} ${styles.positionSecondary}`}>
                                  {tp.player.secondary_position}
                                </span>
                              )}
                              {tp.is_captain && <span className={styles.captainBadge}>©</span>}
                            </div>
                          )}
                          {(!tp.player?.primary_position && !tp.player?.secondary_position && tp.is_captain) && (
                            <div className={styles.playerPositionRow}>
                              <span className={styles.captainBadge}>©</span>
                            </div>
                          )}
                        </div>
                      </span>
                      <div className={styles.playerActions}>
                        <button
                          className={`${styles.captainBtn} ${tp.is_captain ? styles.active : ''}`}
                          onClick={() => toggleCaptain(tp)}
                          title={tp.is_captain ? 'Capitão' : 'Definir como capitão'}
                          disabled={tp.is_captain}
                        >
                          ©
                        </button>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removePlayerFromTeam(tp.id)}
                          title="Remover do time"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

